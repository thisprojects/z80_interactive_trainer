import { startWith, hints } from './helpers.js'

export default [
  {
    id: 'records',
    title: 'Records: fields at fixed offsets',
    module: 'Data structures',
    intro: 'A record groups different values in consecutive bytes. Each field sits at a fixed offset from the start.',
    content: [
      { type: 'text', text: 'To store a player you might keep health, ammo and score together as three bytes. That is a record (a "struct" in other languages). Field 0 is at the start, field 1 one byte later and so on. Name the offsets with `EQU` so the code reads like `player.score`:' },
      { type: 'compare', high: 'player.score = player.score + 5', z80: 'SCORE   EQU 2\n        LD HL,player\n        LD DE,SCORE\n        ADD HL,DE\n        LD A,(HL)\n        ADD A,5\n        LD (HL),A\nplayer: DB 100,5,20' },
      {
        type: 'code',
        code: `HEALTH  EQU 0           ; offsets of each field
AMMO    EQU 1
SCORE   EQU 2
        ORG 0x8000
        LD HL,player
        LD DE,SCORE
        ADD HL,DE       ; HL = address of the score field
        LD A,(HL)
        OUT (1),A       ; prints 20
        HALT
player: DB 100,5,20     ; health, ammo, score`,
        prints: '20',
      },
      { type: 'tip', text: 'An array of records works the same way: element `i` starts at `base + i * record_size`.' },
    ],
    task: ['HL points at a record of three bytes: health, ammo, score.', 'Take 1 away from the ammo field and add 10 to the score field. Leave health alone. Ammo is at least 1 and the score stays at most 255.'],
    starterCode: startWith('HL points at: health, ammo, score'),
    hints: hints(
      ['Step HL past the health byte to reach ammo, then past ammo to reach score.', 'Work on each field with a read, a change and a write back, e.g. DEC (HL) works directly on memory.'],
      'DEC (HL) on the ammo byte; ADD to the score byte.',
      `        ORG 0x8000
        INC HL          ; HL -> ammo
        DEC (HL)        ; ammo = ammo - 1
        INC HL          ; HL -> score
        LD A,(HL)
        ADD A,10
        LD (HL),A       ; score = score + 10
        HALT`,
    ),
    tests: [
      { name: 'typical player', setup: { registers: { HL: 0x9000 }, memory: { 0x9000: [100, 5, 20] } }, expect: { memory: { 0x9000: [100, 4, 30] } } },
      { name: 'last bullet', setup: { registers: { HL: 0x9100 }, memory: { 0x9100: [50, 1, 0] } }, expect: { memory: { 0x9100: [50, 0, 10] } } },
      { name: 'score reaches 255', setup: { registers: { HL: 0x9200 }, memory: { 0x9200: [1, 9, 245] } }, expect: { memory: { 0x9200: [1, 8, 255] } } },
    ],
  },
  {
    id: 'index-registers',
    title: 'IX: reading fields by name',
    module: 'Data structures',
    intro: 'The index register `IX` reads and writes a field at a fixed offset without moving the pointer.',
    content: [
      { type: 'text', text: 'Stepping HL through a record is fiddly. The Z80 has two extra pointer registers, `IX` and `IY`, with a special form: `(IX+d)` is the byte `d` bytes after the address in IX (d from -128 to 127). IX never moves, so you can reach any field in any order, and the offset reads like a field name.' },
      { type: 'compare', high: 'player.score = player.score + 5', z80: 'SCORE   EQU 2\n        LD IX,player\n        LD A,(IX+SCORE)\n        ADD A,5\n        LD (IX+SCORE),A\nplayer: DB 100,5,20' },
      {
        type: 'code',
        code: `AMMO    EQU 1
SCORE   EQU 2
        ORG 0x8000
        LD IX,player
        LD A,(IX+SCORE)
        ADD A,5
        LD (IX+SCORE),A ; score = 25
        LD A,(IX+AMMO)
        OUT (1),A       ; prints 5
        HALT
player: DB 100,5,20`,
        prints: '5',
      },
      { type: 'text', text: 'Many instructions accept `(IX+d)` where they accept `(HL)`: `LD A,(IX+d)`, `ADD A,(IX+d)`, `INC (IX+d)`, `DEC (IX+d)`, `CP (IX+d)` and `BIT 0,(IX+d)`. `LD (IX+d),n` stores a constant straight into a field.' },
      { type: 'text', text: 'IX can itself be moved. `INC IX` steps one byte, and `ADD IX,DE` adds a 16-bit amount, which is how you step from one record to the next in a list of records. Put the record size in DE first.' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD IX,players
        LD DE,3         ; each record is three bytes
        ADD IX,DE       ; IX now points at the second record
        LD A,(IX+2)     ; its third field
        OUT (1),A       ; prints 6
        HALT
players: DB 1,2,3,4,5,6`,
        prints: '6',
      },
      { type: 'tip', text: '`IY` is a second index register that works in exactly the same way.' },
    ],
    task: ['IX points at a record of three bytes: x, y and total.', 'Set total (offset 2) to x + y, and double y (offset 1) in place. Leave x alone.'],
    starterCode: startWith('IX points at: x, y, total'),
    hints: hints(
      ['Read x with LD A,(IX+0) and add y with ADD A,(IX+1).', 'Store the sum with LD (IX+2),A, then double y: read it, ADD A,A, write it back.'],
      'Compute the total first, then double y.',
      `        ORG 0x8000
        LD A,(IX+0)     ; x
        ADD A,(IX+1)    ; + y
        LD (IX+2),A     ; total
        LD A,(IX+1)
        ADD A,A         ; y * 2
        LD (IX+1),A
        HALT`,
    ),
    tests: [
      { name: '3, 4', setup: { registers: { IX: 0x9000 }, memory: { 0x9000: [3, 4, 0] } }, expect: { memory: { 0x9000: [3, 8, 7] } } },
      { name: '10, 20, stale total', setup: { registers: { IX: 0x9100 }, memory: { 0x9100: [10, 20, 99] } }, expect: { memory: { 0x9100: [10, 40, 30] } } },
      { name: 'zeros', setup: { registers: { IX: 0x9200 }, memory: { 0x9200: [0, 0, 5] } }, expect: { memory: { 0x9200: [0, 0, 0] } } },
    ],
  },
  {
    id: 'lookup-tables',
    title: 'Lookup tables',
    module: 'Data structures',
    intro: 'Instead of computing an answer, store all the answers in a table and index it.',
    content: [
      { type: 'text', text: 'When there is no instruction for what you want, or a calculation would be slow, write the answers out with `DB` and look them up. The input becomes the index: the table address plus the input is where its answer lives. Put the index in `DE` (with D = 0), add it to the table address in HL, and read `(HL)`.' },
      { type: 'compare', high: 'powers = [1, 2, 4, 8, 16]\nresult = powers[i]', z80: '        LD HL,pow\n        LD E,A\n        LD D,0\n        ADD HL,DE\n        LD A,(HL)\npow:    DB 1,2,4,8,16' },
      {
        type: 'code',
        code: `        ORG 0x8000
        LD A,3          ; which entry
        LD HL,pow
        LD E,A
        LD D,0
        ADD HL,DE       ; HL = pow + 3
        LD A,(HL)
        OUT (1),A       ; prints 8
        HALT
pow:    DB 1,2,4,8,16`,
        prints: '8',
      },
    ],
    task: ['A holds a digit from 0 to 9.', 'Replace A with its square using a lookup table. Write the table yourself with DB and give it the label squares.'],
    starterCode: startWith('A contains a digit 0-9', 'define the table after HALT'),
    hints: hints(
      ['The table needs ten entries: 0, 1, 4, 9, 16, 25, 36, 49, 64, 81.', 'Use A as the index: copy it to E, clear D, and add the table address to it.'],
      'Index the table with A and read the answer.',
      `        ORG 0x8000
        LD HL,squares
        LD E,A
        LD D,0
        ADD HL,DE       ; point at the entry for A
        LD A,(HL)
        HALT
squares: DB 0,1,4,9,16,25,36,49,64,81`,
    ),
    tests: [
      { name: '0', setup: { registers: { A: 0 } }, expect: { registers: { A: 0 } } },
      { name: '3', setup: { registers: { A: 3 } }, expect: { registers: { A: 9 } } },
      { name: '7', setup: { registers: { A: 7 } }, expect: { registers: { A: 49 } } },
      { name: '9', setup: { registers: { A: 9 } }, expect: { registers: { A: 81 } } },
    ],
  },
]
