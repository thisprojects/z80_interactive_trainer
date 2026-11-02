# Z80 Trainer

An interactive trainer for Z80 assembly, in two parts. **Learn** is a course: each lesson explains one idea (registers, arithmetic, memory, control flow, loops, subroutines, data structures, error handling and more) and sets a small coding task, and **Next** moves to the following lesson. **Challenges** are harder tasks that combine what the lessons taught. In both, write assembly in the editor and press **Run**: your code is assembled and executed in the browser by a built-in assembler and Z80 emulator, then checked against hidden test cases. Every task has hints that stay hidden until you open them, ending in a clearly labelled spoiler with the full solution. Press Ctrl/Cmd+Enter to run. Progress (your code, the tab you were on and a tick for each finished lesson and challenge) is kept in your browser's local storage. A **Cheat sheet** page lists every supported instruction and common patterns.

Built with React, Vite, Tailwind and CodeMirror 6. No server, no ROM and no external Z80 libraries.

## Getting started

Requires Node 22.12 or newer (see `.nvmrc`).

```
npm install
npm run dev        # http://localhost:5173
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm test` | Unit and component tests (Vitest) with coverage thresholds. |
| `npm run lint` | ESLint. |
| `npm run e2e` | Browser tests (Playwright). Builds the app and serves it on port 4173. Runs Playwright's own headless Chromium (not your installed Chrome). First time on a machine: `npx playwright install chromium`. |
| `npm run build` | Production build into `dist/`. |
| `npm run check:assembler` | Compare our assembler's bytes with `pasmo` (needs `pasmo` installed). |

The CPU is also checked against a reference implementation: `pip install -r tools/requirements.txt`, then `python -I tools/compare_cpu.py`.

## Documentation

- [`docs/assembler.md`](docs/assembler.md): the assembler syntax, supported instructions, console ports and limits.
- [`docs/lessons.md`](docs/lessons.md): how to write a lesson, and how the course is organised.
- [`docs/challenges.md`](docs/challenges.md): how to write a challenge.
- [`docs/REVIEW.md`](docs/REVIEW.md): how correctness is verified and how to re-run each check.
- [`CLAUDE.md`](CLAUDE.md): notes for AI coding assistants working in this repo.

## Project layout

```
src/z80/         assembler.js, cpu.js, machine.js, runner.js, z80Language.js (editor highlighting)
src/data/        lessons.js + lessons/, challenges.js, the two schemas, cheatsheet.js, solutions.js (tests only, never shipped)
src/components/  UI components      src/hooks/useActivity.js  selection, code, ticks and tab, saved in the browser
e2e/             Playwright tests   tools/  reference checks and samples   docs/  documentation
.github/         CI workflow
```
