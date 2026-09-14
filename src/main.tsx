import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { setScheduleData } from './lib/schedule';
import type { ScheduleData } from './types';
import './index.css';


const root = ReactDOM.createRoot(document.getElementById('root')!);

async function startApp() {
  try {
    const response = await fetch('/schedule.json');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const schedule = (await response.json()) as ScheduleData;
    setScheduleData(schedule);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  } catch {
    root.render(
      <main className="grid min-h-screen place-items-center bg-canvas px-6 text-center text-ink">
        <div>
          <h1 className="text-xl font-black">Rozvrh se nepodařilo načíst</h1>
          <p className="mt-2 text-sm font-medium text-muted">
            Obnovte stránku nebo zkontrolujte připojení.
          </p>
        </div>
      </main>,
    );
  }
}

void startApp();
