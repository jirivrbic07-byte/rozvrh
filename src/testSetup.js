import { readFileSync } from 'node:fs';

globalThis.__SCHEDULE_DATA__ = JSON.parse(
  readFileSync(new URL('./data/schedule.json', import.meta.url), 'utf8'),
);
