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
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD HL,player
        LD DE,SCORE
        ADD HL,DE       ; HL = address of the score field
        LD A,(HL)
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 20
        HALT
player: DB 100,5,20     ; health, ammo, score`,
        prints: '20',
      },
      { type: 'tip', text: 'An array of records works the same way: element `i` starts at `base + i * record_size`.' },
    ],
    task: ['Create a record called player of three bytes: health 100, ammo 5 and score 20.', 'Take 1 away from the ammo field and add 10 to the score field. Leave health alone.'],
    starterCode: startWith('define the record player with DB after HALT'),
    hints: hints(
      ['Put the record after HALT: the label player, then DB with the three values in order (health, ammo, score).', 'Point HL at player, then step past the health byte to reach ammo, and past ammo to reach score.', 'Work on each field with a read, a change and a write back, e.g. DEC (HL) works directly on memory.'],
      'Define the record, DEC (HL) on the ammo byte, ADD to the score byte.',
      `        ORG 0x8000
        LD HL,player
        INC HL          ; HL -> ammo
        DEC (HL)        ; ammo = ammo - 1
        INC HL          ; HL -> score
        LD A,(HL)
        ADD A,10
        LD (HL),A       ; score = score + 10
        HALT
player: DB 100,5,20     ; health, ammo, score`,
    ),
    tests: [
      { name: 'typical player', expect: { memory: { player: [100, 4, 30] } } },
      { name: 'last bullet', setup: { memory: { player: [50, 1, 0] } }, expect: { memory: { player: [50, 0, 10] } } },
      { name: 'score reaches 255', setup: { memory: { player: [1, 9, 245] } }, expect: { memory: { player: [1, 8, 255] } } },
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
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD IX,player
        LD A,(IX+SCORE)
        ADD A,5
        LD (IX+SCORE),A ; score = 25
        LD A,(IX+AMMO)
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 5
        HALT
player: DB 100,5,20`,
        prints: '5',
      },
      { type: 'text', text: 'Many instructions accept `(IX+d)` where they accept `(HL)`: `LD A,(IX+d)`, `ADD A,(IX+d)`, `INC (IX+d)`, `DEC (IX+d)`, `CP (IX+d)` and `BIT 0,(IX+d)`. `LD (IX+d),n` stores a constant straight into a field.' },
      { type: 'tip', text: '`IY` is a second index register that works in exactly the same way.' },
    ],
    task: ['Create a record called point of three bytes: x 3, y 4 and total 0.', 'Set total (offset 2) to x + y, and double y (offset 1) in place. Leave x alone.'],
    starterCode: startWith('define the record point with DB after HALT, then use IX on it'),
    hints: hints(
      ['Define point with DB after HALT, point IX at it with LD IX,point, then read x with LD A,(IX+0) and add y with ADD A,(IX+1).', 'Store the sum with LD (IX+2),A, then double y: read it, ADD A,A, write it back.'],
      'Define the record, compute the total first, then double y.',
      `        ORG 0x8000
        LD IX,point
        LD A,(IX+0)     ; x
        ADD A,(IX+1)    ; + y
        LD (IX+2),A     ; total
        LD A,(IX+1)
        ADD A,A         ; y * 2
        LD (IX+1),A
        HALT
point:  DB 3,4,0        ; x, y, total`,
    ),
    tests: [
      { name: '3, 4', expect: { memory: { point: [3, 8, 7] } } },
      { name: '10, 20, stale total', setup: { memory: { point: [10, 20, 99] } }, expect: { memory: { point: [10, 40, 30] } } },
      { name: 'zeros', setup: { memory: { point: [0, 0, 5] } }, expect: { memory: { point: [0, 0, 0] } } },
    ],
  },
  {
    id: 'ix-stepping',
    title: 'Stepping IX through a list of records',
    module: 'Data structures',
    intro: 'Move IX on by the record size to visit each record in a list.',
    content: [
      { type: 'text', text: 'So far you have used one record. A program often needs many of the same kind, such as several players. In a high-level language that is an array of objects. On the Z80 it is the same record written out again and again, with no gaps between them, so the second record starts exactly one record size after the first:' },
      { type: 'compare', high: 'players = [\n  {health: 100, ammo: 5, score: 20},\n  {health: 80,  ammo: 3, score: 40},\n]', z80: 'players: DB 100,5,20   ; player 0\n         DB 80,3,40    ; player 1' },
      { type: 'text', text: 'Each record here is three bytes, so player 0 starts at `players`, player 1 at `players+3`, player 2 at `players+6`, and so on. The field offsets (health 0, ammo 1, score 2) are the same inside every record. To reach player 1 you move `IX` on by the record size: `INC IX` steps one byte, and `ADD IX,DE` adds a 16-bit amount, so put the record size in DE first. Then `(IX+SCORE)` is the score of that player.' },
      {
        type: 'code',
        code: `SIZE    EQU 3           ; bytes in one record
SCORE   EQU 2           ; offset of the score field
        ORG 0x8000
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD IX,players
        LD DE,SIZE
        ADD IX,DE       ; IX now points at the second player
        LD A,(IX+SCORE)
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 40
        HALT
players: DB 100,5,20    ; health, ammo, score
         DB 80,3,40`,
        prints: '40',
      },
      { type: 'tip', text: 'Loop over a list of records with a counter in B: do the work with `(IX+field)`, add the record size to IX, and let `DJNZ` count the records.' },
    ],
    task: ['Create a list called players of three records, each three bytes: health, ammo and score. The records are (100, 2, 20), (80, 0, 40) and (60, 7, 0).', 'Give every player 10 ammo and add 5 to their score.'],
    starterCode: startWith('define the list players with DB after HALT, then use IX on it'),
    hints: hints(
      ['Define players after HALT: nine DB values, three records of health, ammo and score.', 'Point IX at players, put the number of players in B and the record size in DE. Each pass changes the ammo and score fields with (IX+offset), then moves IX on to the next record.'],
      'A loop of three passes: set the ammo, add to the score, then step IX on by three.',
      `AMMO    EQU 1
SCORE   EQU 2
SIZE    EQU 3
        ORG 0x8000
        LD IX,players
        LD B,3          ; three players
        LD DE,SIZE      ; size of a record
loop:   LD (IX+AMMO),10 ; refill the ammo
        LD A,(IX+SCORE)
        ADD A,5
        LD (IX+SCORE),A ; score = score + 5
        ADD IX,DE       ; on to the next player
        DJNZ loop
        HALT
players: DB 100,2,20
         DB 80,0,40
         DB 60,7,0`,
    ),
    tests: [
      { name: 'the given players', expect: { memory: { players: [100, 10, 25, 80, 10, 45, 60, 10, 5] } } },
      { name: 'other values', setup: { memory: { players: [1, 1, 1, 2, 2, 2, 3, 3, 3] } }, expect: { memory: { players: [1, 10, 6, 2, 10, 7, 3, 10, 8] } } },
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
        LD A,2
        CALL 0x1601     ; open the main screen channel
        LD A,3          ; which entry
        LD HL,pow
        LD E,A
        LD D,0
        ADD HL,DE       ; HL = pow + 3
        LD A,(HL)
        LD C,A
        LD B,0
        CALL 0x2D2B
        CALL 0x2DE3     ; prints 8
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
