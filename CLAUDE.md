# Z80 Trainer

Interactive Z80 assembly trainer: React + Vite + Tailwind, CodeMirror 6 editor, 30% instruction pane and 70% editor with a challenge dropdown in the top bar. Code is assembled and run in the browser by a built-in assembler and emulator (no Spectrum ROM, no external Z80 libraries). `README.md` has the commands and layout; `docs/` has the details.

## Commands
`npm run dev`, `npm test`, `npm run lint`, `npm run e2e`, `npm run build`, `npm run check:assembler` (see the README). Run `npm test`, `npm run lint` and `npm run e2e` before finishing a change. CPU reference check: `python -I tools/compare_cpu.py` (in this workspace the Python venv is `../venv`, so use `../venv/bin/python -I tools/compare_cpu.py`; install nothing outside that venv). CI is `.github/workflows/ci.yml` (lint/test/build, CPU reference, assembler reference, e2e).

## Where things are
- `src/z80/`: `assembler.js` (two-pass), `cpu.js`, `machine.js` (memory, console I/O, output cap), `runner.js` (runs a challenge's tests), `z80Language.js` (highlighting).
- `src/data/`: `challenges.js`, `challengeSchema.js` (documents and validates the schema), `solutions.js` (reference solutions, imported by tests only so they stay out of the bundle; an e2e test enforces this).
- `src/components/`, `src/hooks/useChallenge.js`, `src/App.jsx`: the UI. `e2e/`: Playwright tests. `tools/`: reference checks and samples. `docs/`: documentation.

## Rules for changes
- **Challenges:** the instruction pane says what to do, never how; method help goes in `hints`. Full guide: `docs/challenges.md`. Every challenge needs a solution in `solutions.js` and several test cases.
- **Assembler/CPU:** keep output byte-identical to `pasmo` (`npm run check:assembler`) and flags identical to the Python `z80` package (`tools/compare_cpu.py`). Update `docs/assembler.md` when behaviour or the supported instruction set changes.
- **Docs:** don't hard-code test counts or dates in prose; point at the command that prints them.
- Don't import `solutions.js` from app code. Don't install packages outside the project or its venv without asking.
