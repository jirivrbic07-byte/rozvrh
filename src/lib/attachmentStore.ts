import type { AttachmentRecord } from '../types';

const DATABASE_NAME = 'rozvrh-zop-documents';
const STORE_NAME = 'attachments';
const DATABASE_VERSION = 1;

interface StoredAttachment extends AttachmentRecord {
  blob: Blob;
}

const openDatabase = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const runRequest = async <T>(
  mode: IDBTransactionMode,
  createRequest: (store: IDBObjectStore) => IDBRequest<T>,
) => {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const request = createRequest(transaction.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const saveLocalAttachment = (attachment: AttachmentRecord, blob: Blob) =>
  runRequest('readwrite', (store) =>
    store.put({ ...attachment, blob } satisfies StoredAttachment),
  ).then(() => undefined);

export const listLocalAttachments = async (): Promise<AttachmentRecord[]> => {
  const records = await runRequest<StoredAttachment[]>('readonly', (store) =>
    store.getAll(),
  );
  return records
    .map(({ blob: _blob, ...attachment }) => attachment)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
};

export const getLocalAttachmentBlob = async (id: string) => {
  const record = await runRequest<StoredAttachment | undefined>('readonly', (store) =>
    store.get(id),
  );
  return record?.blob;
};
