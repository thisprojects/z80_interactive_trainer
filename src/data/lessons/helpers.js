// Small helpers so the lesson files stay readable.

export const START = '        ORG 0x8000\n\n        ; your code here\n\n        HALT\n'

// Starter code with a comment saying what the registers hold.
export const startWith = (...comments) => `        ORG 0x8000\n\n${comments.map((c) => `        ; ${c}\n`).join('')}\n        HALT\n`

// Opens the main screen (channel 2) so RST 0x10 has somewhere to print. Programs that print start with this.
export const SCREEN_INIT = '        LD A,2\n        CALL 0x1601     ; open the main screen channel\n'

// Starter code for a task that prints: the screen set-up, then comments saying what the registers hold.
export const startWithScreen = (...comments) => `        ORG 0x8000\n${SCREEN_INIT}\n${comments.map((c) => `        ; ${c}\n`).join('')}\n        HALT\n`

// Hints "Hint 1", "Hint 2", ... followed by the closing spoiler with the full solution.
export function hints(pointers, spoilerBody, code) {
  return [
    ...pointers.map((body, i) => ({ title: `Hint ${i + 1}`, body })),
    { title: 'Spoiler: full solution', spoiler: true, body: spoilerBody, code: `${code}\n` },
  ]
}
