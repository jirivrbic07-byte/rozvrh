# Rozvrh výcviku

Responzivní aplikace pro školní a výcvikový rozvrh. Data rozvrhu pokrývají týdny 36–44 (září a říjen 2026), jsou převedena z dodaných Excelů a zahrnují také třídu `III/4A/2026`. Volba třídy se ukládá do `localStorage` a osobní poznámky se synchronizují přes Firebase.

V detailu hodiny lze přidat PDF, DOC a DOCX dokumenty do velikosti 20 MB. Soubory se ukládají lokálně do IndexedDB daného prohlížeče, takže nevyžadují Firebase Storage ani placený tarif. Nejsou však automaticky dostupné na jiném zařízení. Průzkumník sdružuje poznámky, popisy a dokumenty a umí je filtrovat podle více předmětů a rozsahu data výuky.

## Spuštění

```bash
npm install
npm run dev
```

Produkční kontrola:

```bash
npm test
npm run build
```

## Firebase

1. Ve Firebase Console vytvořte Firestore databázi v produkčním režimu.
2. V **Authentication → Sign-in method** zapněte poskytovatele **Anonymous**. Poznámky jsou díky tomu soukromé pro konkrétní anonymní účet v prohlížeči.
3. Obsah souboru `firestore.rules` vložte do záložky **Firestore Database → Rules** a publikujte.
4. Pro nasazení přes Firebase CLI použijte `firebase deploy`. Soubor `firebase.json` nastavuje hosting z adresáře `dist` i pravidla Firestore. Firebase Storage není potřeba zapínat.

Když anonymní přihlášení nebo Firestore nejsou dostupné, aplikace automaticky uchová poznámky pouze v `localStorage` daného zařízení. Přiložené dokumenty zůstávají vždy pouze v lokální databázi prohlížeče.

## Aktualizace dat z Excelu

Skript `scripts/extract_schedule.py` převádí všechny týdenní listy, umí spojit více měsíčních souborů a zachovává skutečné pozice sloučených buněk:

```bash
python3 scripts/extract_schedule.py zari.xlsx rijen.xlsx src/data/schedule.json
```

Text každého bloku se za běhu zpracuje funkcí `parseScheduleCell` v `src/lib/parser.ts`.
Rozvrh odpovídá dodaným Excelům bez dalších ručních oprav. Případné budoucí ověřené změny lze vložit do `src/data/scheduleOverrides.ts`.


## GitHub a Vercel

Repozitář: https://github.com/jirivrbic07-byte/rozvrh

Ve Vercelu importujte tento repozitář. Framework je Vite, build `npm run build`, výstupní složka `dist`. Firebase konfigurace již odpovídá projektu `rozvrh-zop`. Není potřeba nastavovat žádný soukromý klíč; webová konfigurace Firebase je veřejná a přístup k datům řídí Firestore rules.

Pravidla povolují pouze čtení a zápis vlastních poznámek a popisů autentizovaného uživatele, ostatní přístup je zamítnutý. Samotný rozvrh je součástí webu a funguje bez Firestore. Anonymní účet je svázaný s konkrétním prohlížečem, neposkytuje přihlášení mezi zařízeními. Při smazání dat prohlížeče může zaniknout přístup k tomuto účtu. Přílohy jsou vždy pouze lokální.

Návod k anonymnímu přihlášení: https://firebase.google.com/docs/auth/web/anonymous-auth
Pravidla Firebase: https://firebase.google.com/docs/firestore/security/rules-conditions
