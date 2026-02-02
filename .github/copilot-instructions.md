<!-- Copilot instructions for TimeFlow Weeks Manager -->
# TimeFlow Weeks — Copilot Guidelines

Purpose: help an AI coding agent become productive quickly in this repository.

- Project type: Vite + React (ESM) app using TailwindCSS and `lucide-react` icons.
- Dev commands: `npm install`, `npm run dev`, `npm run build`, `npm run preview` (see [package.json](package.json.txt)).

Quick Architecture
- Single-page React app. Entry: `index.html` -> `src/main.jsx` loads the app.
- Main UI and logic live in `src/App.jsx` (timers, UI, print styles, data model).
- Styling: Tailwind; configuration in `tailwind.config.js` and `postcss.config.js`.
- Build: Vite (`vite.config.js`). No server-side components.

Key patterns and conventions
- Persistence: app uses browser `localStorage` for all data. Important keys (search for them in `src/App.jsx`):
  - `timeflow_tasks` — completed actual tasks array
  - `timeflow_plans` — planned tasks array
  - `timeflow_current` — running main task object
  - `timeflow_sub_current` — running subtask object
  - `timeflow_categories` — categories array
- Task object shape (discoverable in `src/App.jsx`): `id, name, startTime, endTime, duration, date, categoryId, type` (type: `'main'|'sub'` or implicit plan).
- Categories: defined by `DEFAULT_CATEGORIES` (id, name, color). To change category defaults, edit `DEFAULT_CATEGORIES` in `src/App.jsx`.
- Timers: main and sub timers are implemented with `setInterval` effects; stopping a timer creates a completed task and prepends it to `tasks` (persisted to localStorage).

UI / Print behavior
- Print-specific CSS is injected from a `PrintStyles` block in `src/App.jsx`. Look for `.no-print`, `.print-area`, `.print-chart-container` and `.grid-pattern-4mm` classes when changing print layout.
- The app supports a compact "mini" mode (`isMiniMode`) that affects layout and placement of controls.

Developer workflows
- Run development server: `npm run dev` (Vite). Use browser devtools to inspect `localStorage` keys to verify state changes.
- Build: `npm run build`. Preview the build locally with `npm run preview`.
- No tests are present; run manual checks, especially around timers and persistence.

Editing tips for agents
- Preserve localStorage keys and task shape when modifying state or persistence code to avoid breaking existing user data.
- When changing timers, keep interval cleanup in `useEffect` return callbacks to avoid duplicate timers.
- Print and grid styles are implemented inline — small layout tweaks are often made in `PrintStyles` (search in `src/App.jsx`).

Integration points / external deps
- `lucide-react` for icons — UI code imports many icons directly in `src/App.jsx`.
- Tailwind + PostCSS — changes to utility classes usually require editing JSX and `tailwind.config.js` only.

Examples (copyable) — localStorage read/write (from source):
```js
const savedTasks = localStorage.getItem('timeflow_tasks');
if (savedTasks) setTasks(JSON.parse(savedTasks));
localStorage.setItem('timeflow_tasks', JSON.stringify(tasks));
```

Where to look first
- `src/App.jsx` — start here for business logic, timers, and persistence.
- `src/main.jsx` — tailwind import / app mount.
- `index.html` and `vite.config.js` — dev server and build entry points.
- `tailwind.config.js`, `postcss.config.js` — styling pipeline.

If you modify data shapes
- Add a migration path: detect old shapes in `localStorage` and transform on load rather than silently changing the format.

What I did: created this guidance by reading the app entry and main component; ask if you want more examples (component map, common edits, or a migration helper).
