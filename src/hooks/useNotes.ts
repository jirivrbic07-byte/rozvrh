import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import {
  getLocalAttachmentBlob,
  listLocalAttachments,
  saveLocalAttachment,
} from '../lib/attachmentStore';
import { db, getFirebaseUserId } from '../lib/firebase';
import type {
  AttachmentRecord,
  BlockDescription,
  NoteRecord,
  ScheduleBlock,
  SyncMode,
} from '../types';

const NOTES_KEY = 'rozvrh-zop-notes';
const DESCRIPTIONS_KEY = 'rozvrh-zop-descriptions';
const MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024;

const DOCUMENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The app stays usable when private browsing blocks localStorage writes.
  }
};

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const getDocumentType = (file: File) => {
  const extension = file.name.split('.').pop()?.toLocaleLowerCase('cs-CZ') ?? '';
  return DOCUMENT_TYPES[extension];
};

function mergeRecords<T extends { updatedAt: string }>(local: T[], remote: T[], key: (value: T) => string): T[] {
  const items = new Map(local.map(item => [key(item), item]));
  for (const item of remote) {
    const previous = items.get(key(item));
    if (!previous || previous.updatedAt <= item.updatedAt) items.set(key(item), item);
  }
  return [...items.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function saveIfNewer(collectionName: string, id: string, value: NoteRecord | BlockDescription, userId: string) {
  const reference = doc(db, 'users', userId, collectionName, id);
  const existing = await getDoc(reference);
  if (!existing.exists() || existing.data().updatedAt < value.updatedAt) await setDoc(reference, value);
}

export function useNotes() {
  const [notes, setNotes] = useState<NoteRecord[]>(() =>
    readLocal<NoteRecord[]>(NOTES_KEY, []),
  );
  const [descriptions, setDescriptions] = useState<Record<string, BlockDescription>>(
    () => readLocal<Record<string, BlockDescription>>(DESCRIPTIONS_KEY, {}),
  );
  const [attachments, setAttachments] = useState<AttachmentRecord[]>([]);
  const [syncMode, setSyncMode] = useState<SyncMode>('connecting');
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let stopNotes: (() => void) | undefined;
    let stopDescriptions: (() => void) | undefined;
    let notesReady = false;
    let descriptionsReady = false;
    const updateSync = () => { if (active && notesReady && descriptionsReady) setSyncMode('cloud'); };
    const localNotes = readLocal<NoteRecord[]>(NOTES_KEY, []);
    const localDescriptions = readLocal<Record<string, BlockDescription>>(
      DESCRIPTIONS_KEY,
      {},
    );

    listLocalAttachments()
      .then((items) => {
        if (active) setAttachments(items);
      })
      .catch(() => {
        if (active) setAttachments([]);
      });

    getFirebaseUserId()
      .then(async (userId) => {
        if (!active) return;
        userIdRef.current = userId;


        await Promise.all([
          ...localNotes.map((note) =>
            saveIfNewer('notes', note.id, note, userId),
          ),
          ...Object.entries(localDescriptions).map(([blockId, blockDescription]) =>
            saveIfNewer('blockMeta', blockId, blockDescription, userId),
          ),
        ]);
        if (!active) return;

        const notesQuery = query(
          collection(db, 'users', userId, 'notes'),
          orderBy('createdAt', 'desc'),
        );
        stopNotes = onSnapshot(
          notesQuery,
          { includeMetadataChanges: true },
          (snapshot) => {
            const cloudNotes = snapshot.docs.map((item) => item.data() as NoteRecord);
            if (!active) return;
            notesReady = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
            updateSync();
            setNotes(current => {
              const merged = mergeRecords(current, cloudNotes, item => item.id);
              writeLocal(NOTES_KEY, merged);
              return merged;
            });
          },
          () => { if (active) setSyncMode('local'); },
        );

        stopDescriptions = onSnapshot(
          collection(db, 'users', userId, 'blockMeta'),
          { includeMetadataChanges: true },
          (snapshot) => {
            const cloudDescriptions = Object.fromEntries(
              snapshot.docs.map((item) => [item.id, item.data() as BlockDescription]),
            );
            if (!active) return;
            descriptionsReady = !snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites;
            updateSync();
            setDescriptions(current => {
              const merged = Object.fromEntries(mergeRecords(Object.values(current), Object.values(cloudDescriptions), item => item.blockId).map(item => [item.blockId, item]));
              writeLocal(DESCRIPTIONS_KEY, merged);
              return merged;
            });
          },
          () => { if (active) setSyncMode('local'); },
        );

      })
      .catch(() => {
        if (active) setSyncMode('local');
      });

    return () => {
      active = false;
      stopNotes?.();
      stopDescriptions?.();
    };
  }, []);

  const addNote = useCallback(async (block: ScheduleBlock, body: string) => {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    const now = new Date().toISOString();
    const note: NoteRecord = {
      id: createId(),
      blockId: block.id,
      classId: block.classId,
      weekId: block.weekId,
      dayId: block.dayId,
      date: block.date,
      subjectCode: block.subjectCode,
      body: trimmedBody.slice(0, 2000),
      createdAt: now,
      updatedAt: now,
    };

    setNotes((current) => {
      const next = [note, ...current];
      writeLocal(NOTES_KEY, next);
      return next;
    });

    const userId = userIdRef.current;
    if (userId) {
      try {
        await setDoc(doc(db, 'users', userId, 'notes', note.id), note);
      } catch {
        setSyncMode('local');
      }
    }
  }, []);

  const saveDescription = useCallback(async (blockId: string, description: string) => {
    const blockDescription: BlockDescription = {
      blockId,
      description: description.trim().slice(0, 2000),
      updatedAt: new Date().toISOString(),
    };

    setDescriptions((current) => {
      const next = { ...current, [blockId]: blockDescription };
      writeLocal(DESCRIPTIONS_KEY, next);
      return next;
    });

    const userId = userIdRef.current;
    if (userId) {
      try {
        await setDoc(doc(db, 'users', userId, 'blockMeta', blockId), blockDescription);
      } catch {
        setSyncMode('local');
      }
    }
  }, []);

  const uploadAttachment = useCallback(
    async (
      block: ScheduleBlock,
      file: File,
      onProgress?: (progress: number) => void,
    ) => {
      const contentType = getDocumentType(file);
      if (!contentType) {
        throw new Error('Povolené jsou pouze soubory PDF, DOC a DOCX.');
      }
      if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error('Soubor je větší než povolených 20 MB.');
      }

      const id = createId();
      const attachment: AttachmentRecord = {
        id,
        blockId: block.id,
        classId: block.classId,
        weekId: block.weekId,
        dayId: block.dayId,
        date: block.date,
        subjectCode: block.subjectCode,
        name: file.name.slice(0, 180) || `dokument-${id}`,
        contentType,
        size: file.size,
        createdAt: new Date().toISOString(),
      };
      onProgress?.(20);
      await saveLocalAttachment(attachment, file);
      onProgress?.(100);
      setAttachments((current) => [attachment, ...current]);
      return attachment;
    },
    [],
  );

  const openAttachment = useCallback(async (attachment: AttachmentRecord) => {
    const blob = await getLocalAttachmentBlob(attachment.id);
    if (!blob) throw new Error('Dokument už není v tomto prohlížeči dostupný.');
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.download = attachment.contentType === 'application/pdf' ? '' : attachment.name;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }, []);

  return {
    notes,
    descriptions,
    attachments,
    syncMode,
    addNote,
    saveDescription,
    uploadAttachment,
    openAttachment,
  };
}
