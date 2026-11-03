# Z80 Trainer

Interactive Z80 assembly trainer: React + Vite + Tailwind, CodeMirror 6 editor, 30% instruction pane and 70% editor. Two tabs in the top bar: **Learn** (lessons: a topic is explained in the left pane, then a coding task is set) and **Challenges** (harder tasks that combine what the lessons taught), each with a dropdown. Code is assembled and run in the browser by a built-in assembler and emulator (no Spectrum ROM, no external Z80 libraries). `README.md` has the commands and layout; `docs/` has the details.

## Commands
`npm run dev`, `npm test`, `npm run lint`, `npm run e2e`, `npm run build`, `npm run check:assembler` (see the README). Run `npm test`, `npm run lint` and `npm run e2e` before finishing a change. CPU reference check: `python -I tools/compare_cpu.py` (in this workspace the Python venv is `../venv`, so use `../venv/bin/python -I tools/compare_cpu.py`; install nothing outside that venv). CI is `.github/workflows/ci.yml` (lint/test/build, CPU reference, assembler reference, e2e).

## Where things are
- `src/z80/`: `assembler.js` (two-pass), `cpu.js`, `machine.js` (memory, console I/O, output cap), `runner.js` (runs a challenge's tests), `z80Language.js` (highlighting).
- `src/data/`: `lessons.js` (the course; one file per module in `lessons/`), `lessonSchema.js`, `challenges.js`, `challengeSchema.js` (document and validate the schemas), `solutions.js` (reference solutions, imported by tests only so they stay out of the bundle; an e2e test enforces this for challenges; the spoiler hints in `lessons/` and `challenges.js` do ship, hidden until opened, and a lesson's reference solution is its spoiler code), `cheatsheet.js`.
- `src/components/`, `src/hooks/useActivity.js` (selection, code, completion ticks and tab, saved in localStorage), `src/App.jsx`: the UI. `e2e/`: Playwright tests. `tools/`: reference checks and samples. `docs/`: documentation.

## Rules for changes
- **Lessons:** teach one idea, then set a task that needs only what has been taught so far (a test checks the instructions). Guide: `docs/lessons.md`. Every worked example must run, and the last hint is a `spoiler: true` hint with the full solution.
- **Challenges:** every challenge lists the lessons it builds on in `uses`. The instruction pane says what to do, never how; method help goes in `hints`. Full guide: `docs/challenges.md`. Every challenge needs a solution in `solutions.js`, several test cases, and progressive hints ending in a `spoiler: true` hint with the commented full solution.
- **Assembler/CPU:** keep output byte-identical to `pasmo` (`npm run check:assembler`) and flags identical to the Python `z80` package (`tools/compare_cpu.py`). Update `docs/assembler.md` when behaviour or the supported instruction set changes.
- **Match the real machine (ZX Spectrum):** never invent mnemonics, `RST` vectors, ports, ROM routines or other machine behaviour. Only use what would work on a real Z80 / ZX Spectrum, and only teach code that is commonly and idiomatically used there. If the emulator stands in for the Spectrum ROM, it must trap a real ROM entry point and behave as the real routine does. For example, `RST 16` prints the character in A and character code 13 is a newline. `RST 8` (error handler) and `RST 24` (collect character) are not print routines. If you are unsure that something exists or behaves that way on a real Spectrum, say so and check rather than guess.
- **Docs:** don't hard-code test counts or dates in prose; point at the command that prints them.
- Don't import `solutions.js` from app code. Don't install packages outside the project or its venv without asking.
- **Git:** never run `git commit` or `git push` (or otherwise publish to the remote). Leave changes uncommitted in the working tree; the owner commits and pushes.
