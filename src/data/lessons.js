// The course, in teaching order, one file per module in ./lessons/. To add a lesson, append
// an object that follows the schema documented in lessonSchema.js (guide: docs/lessons.md).
// Every lesson's last hint is a spoiler with the full solution; the unit tests run it, run
// every worked example, and check the starter code fails, so a lesson is proven solvable and
// its examples are proven to work.
//
// Output ports: OUT (0),A prints a character, OUT (1),A prints A as a decimal number and
// OUT (2),A prints a newline.

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
