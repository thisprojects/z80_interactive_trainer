// The course, in teaching order, one file per module in ./lessons/. To add a lesson, append
// an object that follows the schema documented in lessonSchema.js (guide: docs/lessons.md).
// Every lesson's last hint is a spoiler with the full solution; the unit tests run it, run
// every worked example, and check the starter code fails, so a lesson is proven solvable and
// its examples are proven to work.
//
// Output uses two real ZX Spectrum ROM routines: RST 0x10 prints the character in A (13 = newline) and
// CALL 0x2D2B then CALL 0x2DE3 print BC as a decimal number. See docs/assembler.md.

import values from './lessons/m1-values.js'
import operators from './lessons/m2-operators.js'
import io from './lessons/m3-io.js'
import memory from './lessons/m4-memory.js'
import control from './lessons/m5-control.js'
import loops from './lessons/m6-loops.js'
import arrays from './lessons/m7-arrays.js'
import subroutines from './lessons/m8-subroutines.js'
import structures from './lessons/m9-structures.js'
import robust from './lessons/m10-robust.js'

const lessons = [...values, ...operators, ...io, ...memory, ...control, ...loops, ...arrays, ...subroutines, ...structures, ...robust]

export default lessons
