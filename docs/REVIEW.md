# Verification and review notes

How the project's correctness is checked, and how to re-run each check. Numbers are deliberately not recorded here; the commands print current ones.

| What | How to re-run | Notes |
| --- | --- | --- |
| Unit and component tests, coverage thresholds | `npm test` | Thresholds are in `vite.config.js`. Includes ~1,000 boundary-value CPU cases replayed from `src/z80/cpu.golden.json`, which `python -I tools/make_golden.py` regenerates from the reference package, so flag regressions fail `npm test` even without Python. |
| Lint | `npm run lint` | |
| Browser tests | `npm run e2e` | Headless Playwright Chromium. Types every reference solution into the real editor; also checks layout (including phone sizes), keyboard use, accessibility names, contrast, console health, hints, saving, errors and that no solution ships in the bundle. |
| Assembler against `pasmo` | `npm run check:assembler` | Needs `pasmo`. Covers every reference solution plus `tools/samples/*.asm`. Differences by design: 0b numbers, `^`, `'\n'` escapes and a leading parenthesis are accepted by us but not by `pasmo`, so they are only in unit tests. |
| CPU against the Python `z80` package | `pip install -r tools/requirements.txt` then `python -I tools/compare_cpu.py` | Compares A, F, BC, DE, HL, SP, PC, memory and the stack for ALU, rotates, shifts, bit ops, 16-bit adds, block moves, every jump/call/return condition with every flag value, DJNZ, PUSH/POP, loads and EX. `--strict` also compares the undocumented flag bits 3 and 5, which we do not model. |

CI (`.github/workflows/ci.yml`) runs all of these. Its permissions are read-only, actions are pinned to commit hashes, and Dependabot (`.github/dependabot.yml`) proposes updates; `@playwright/test` is excluded from updates on purpose. It has not been run on GitHub yet (the project has no remote).

## Mutation check

To see how well the tests notice mistakes, temporarily introduce a deliberate bug (flip a CPU flag condition, an assembler boundary, the output cap...) and confirm `npm test` fails. Nineteen such mutations were tried; all are caught.

## Known limits

- Programs run on the main thread. Runaway loops stop at the step limit within milliseconds and sizes are capped, so a Web Worker is not needed yet.
- Each test case re-assembles the source.
- Unsupported instructions are listed in `docs/assembler.md`. Undocumented flag bits 3 and 5 and interrupts are not modelled.
- Nothing shows which challenges a learner has completed.
- `load-a`, `print-char`, `count-up` and `countdown` have one test case because their result is fixed.
- `npm audit` reports a moderate `minimatch` advisory inside ESLint (dev-only). The suggested fix is a downgrade to eslint 4, so it is left alone.
