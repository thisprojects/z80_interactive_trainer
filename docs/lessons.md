# Writing lessons

The trainer has two groups of tasks. **Lessons** (the Learn tab) form a course: each explains one idea in the left pane, then sets a small coding task in the editor. **Challenges** (see [`challenges.md`](challenges.md)) are harder and combine ideas from the course. Lessons live in `src/data/lessons/`, one file per module, gathered in order by `src/data/lessons.js`. The schema is documented, and enforced, in `src/data/lessonSchema.js`.

## The course

The modules run in this order, and a lesson may use anything taught before it:

1. Values and registers: `LD`, copying, number forms, bits and bytes.
2. Arithmetic and bits: add, subtract, increment, shifts, masks, `SET`/`RES`, 16-bit values, carry, `SBC HL`.
3. Input and output: the console ports.
4. Memory and data types: addresses, pointers, arrays, words, `EQU`.
5. Control flow: jumps, flags and `CP`, if/else, `BIT`, combined conditions, wraparound and negative numbers.
6. Loops: counters, `DJNZ`, while loops, accumulating, nesting.
7. Arrays and strings: looping over arrays, strings, `LDIR`, `CPIR`.
8. Subroutines: `CALL`/`RET`, parameters, the stack, preserving registers, `EXX`.
9. Data structures: records, `IX`, lookup tables.
10. Errors and debugging: the carry flag as an error signal, guarding loops, bug hunting, BCD.

## A lesson's shape

- `content` is a list of blocks shown in order: `text` (with `` `inline code` ``), `code` (a worked example), `compare` (a high-level language beside the Z80 version: "in Python you would write this, in Z80 you write that"), `tip` and `table`.
- `task` and `starterCode` set the exercise. The task should use the idea just taught but be *slightly different* from the worked example, so it cannot be answered by copying. Say what to do; the lesson text and hints are where the how belongs.
- `tests` are checked exactly as for challenges. Use several cases including edge cases, and set up the registers or memory the task describes.
- `hints` go from a pointer, to a more concrete pointer, to a final hint that is a **spoiler** (`spoiler: true`, with `body` and the full commented `code`). Every lesson has one so nobody is stuck.

## What the tests enforce

- Every `code` block is a complete program that runs to `HALT` (and prints what its `prints` says), unless it has `fragment: true`, in which case it must at least assemble. `compare` blocks must assemble.
- The lesson's reference solution is its spoiler code, so the spoiler is proven to pass the tests, and the starter code is proven to fail them.
- Every instruction form the solution needs has been shown in the lesson's own text or examples or an earlier lesson's. A form is the instruction plus the operands that change what it is: `ADD IX,DE` is a different form from `ADD A,B`, and `LD A,(IX+d)` from `LD A,(HL)`. If it fails, teach the instruction first (a sentence or a worked example is enough).
- Ids are unique across lessons and challenges; modules stay together in order.

`npm run e2e` types every solution into the real editor.

## Adding one

1. Add the lesson object to the right module file in `src/data/lessons/` (or start a new module file and add it to `src/data/lessons.js`). Use the helpers in `lessons/helpers.js` for starter code and hints.
2. Run `npm test`, `npm run lint` and `npm run e2e`.
3. If a challenge should now build on it, add its id to that challenge's `uses`.

The spoiler code ships in the app (it is hidden until the learner opens it); `solutions.js` is still tests-only and takes its lesson entries from the spoilers.
