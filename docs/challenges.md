# Writing challenges

Challenges live in `src/data/challenges.js`; the field-by-field schema is documented (and enforced) in `src/data/challengeSchema.js`.

## The rule

**The instruction pane says what to do, never how.** `description`, `task` and `explanation` must not give away the method or name the instruction that solves it. Method-level help belongs in `hints`, which stay hidden until the learner opens them. Order hints from a nudge to the near-answer.

### Hints

Hints are progressive: the first ones point at the idea or instruction, an "In outline" hint can give the plan in words, and the **last hint is always a spoiler** that shows a complete, commented solution:

```js
{ title: 'Spoiler: full solution', spoiler: true, body: 'One sentence on how it works.', code: `        ORG 0x8000\n        ...` }
```

The title must say "Spoiler" so learners know before opening it, and it must be the last hint. The app shows it in red and the code only appears once opened. A test runs the spoiler's `code` against the challenge's tests. The spoiler code is part of the shipped bundle, unlike `solutions.js`, which is still tests-only.

## Adding one

1. Append an object to the array in `src/data/challenges.js`.
2. Add a working solution to `src/data/solutions.js` under the same `id`. It is used by the tests only and must never be imported by app code (a browser test fails if any solution reaches the production bundle).
3. Run `npm test`. For every challenge it validates the schema, checks ids are unique, runs your solution against every test case, and checks the starter code does not already pass.
4. Run `npm run e2e`. It types your solution into the real editor and checks the verdict.

## Choosing fields

- `difficulty`: **beginner** is one idea in a few instructions; **intermediate** loops over memory or combines several ideas; **advanced** is a small complete program.
- `category`: one of `basics`, `arithmetic`, `conditionals`, `loops`, `memory`, `subroutines`, `output`.
- `starterCode` must start with `ORG 0x8000` (the schema enforces this) and fail the tests as written.
- `tests`: use several cases, including edge cases (zero, 255, one element, equal values). A single case is acceptable only when the result is fixed. A test checks the registers, memory and console output you list in `expect`, so list everything that matters, including bytes next to a block that must not be touched.
- `requires: { call: { label: 'double', min: 3 } }` makes the program define that label and `CALL` it at least `min` times while running. Use it when the task is to write and use a subroutine.

## Checking your tests are strong

Try a few plausible wrong programs (a no-op, a hard-coded answer, an off-by-one loop) with `runChallenge` and confirm each fails. If one passes, add a test case that catches it.
