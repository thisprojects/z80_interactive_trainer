// Reference solutions, one per challenge id. Used by the unit tests only and never
// imported by the app, so they are not included in the shipped bundle.
//
// A lesson's solution is its spoiler hint (that code ships in the app by design, hidden until
// opened), so lessons are added here from lessons.js rather than written out twice.

import lessons from './lessons.js'

export const challengeSolutions = {
  "countdown": "        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n        LD B,10\nloop:   LD A,B\n        PUSH BC\n        LD C,A\n        LD B,0\n        CALL 0x2D2B\n        CALL 0x2DE3\n        POP BC\n        LD A,13\n        RST 0x10\n        DJNZ loop\n        LD HL,msg\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        RST 0x10\n        INC HL\n        JR next\ndone:   HALT\nmsg:    DB \"Liftoff!\",0\n",
  "sum-to-n": "        ORG 0x8000\n        XOR A\nloop:   ADD A,B\n        DJNZ loop\n        HALT\n",
  "multiply": "        ORG 0x8000\n        XOR A\n        INC B\n        DEC B\n        JR Z,done\nloop:   ADD A,C\n        DJNZ loop\ndone:   HALT\n",
  "max-of-two": "        ORG 0x8000\n        CP B\n        JR NC,done\n        LD A,B\ndone:   HALT\n",
  "even-odd": "        ORG 0x8000\n        LD B,1\n        BIT 0,A\n        JR Z,done\n        LD B,0\ndone:   HALT\n",
  "absolute-value": "        ORG 0x8000\n        BIT 7,A\n        JR Z,done\n        NEG\ndone:   HALT\n",
  "fizzbuzz": "        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n        LD A,H\n        LD (limit),A\n        LD B,1\n        LD C,3\n        LD D,5\nloop:   LD E,0\n        DEC C\n        JR NZ,not3\n        LD C,3\n        SET 0,E\n        LD HL,fizz\n        CALL puts\nnot3:   DEC D\n        JR NZ,not5\n        LD D,5\n        SET 1,E\n        LD HL,buzz\n        CALL puts\nnot5:   LD A,E\n        OR A\n        JR NZ,eol\n        LD A,B\n        PUSH BC\n        LD C,A\n        LD B,0\n        CALL 0x2D2B\n        CALL 0x2DE3\n        POP BC\neol:    LD A,13\n        RST 0x10\n        LD A,(limit)\n        CP B\n        JR Z,finish\n        INC B\n        JR loop\nfinish: HALT\nputs:   LD A,(HL)\n        OR A\n        RET Z\n        RST 0x10\n        INC HL\n        JR puts\nfizz:   DB \"Fizz\",0\nbuzz:   DB \"Buzz\",0\nlimit:  DB 0\n",
  "fill-memory": "        ORG 0x8000\nloop:   LD (HL),A\n        INC HL\n        DJNZ loop\n        HALT\n",
  "sum-array": "        ORG 0x8000\n        XOR A\nloop:   ADD A,(HL)\n        INC HL\n        DJNZ loop\n        HALT\n",
  "largest-in-array": "        ORG 0x8000\n        LD A,(HL)\n        INC HL\n        DEC B\n        JR Z,done\nloop:   CP (HL)\n        JR NC,skip\n        LD A,(HL)\nskip:   INC HL\n        DJNZ loop\ndone:   HALT\n",
  "count-zeros": "        ORG 0x8000\n        LD C,0\nloop:   LD A,(HL)\n        OR A\n        JR NZ,skip\n        INC C\nskip:   INC HL\n        DJNZ loop\n        HALT\n",
  "string-length": "        ORG 0x8000\n        LD B,0\nloop:   LD A,(HL)\n        OR A\n        JR Z,done\n        INC B\n        INC HL\n        JR loop\ndone:   HALT\n",
  "reverse-string": "        ORG 0x8000\n        LD D,H\n        LD E,L\n        LD C,B\n        LD B,0\n        ADD HL,BC\n        DEC HL\nloop:   LD A,H\n        CP D\n        JR C,done\n        JR NZ,swap\n        LD A,L\n        CP E\n        JR C,done\n        JR Z,done\nswap:   LD A,(DE)\n        LD C,(HL)\n        LD (HL),A\n        LD A,C\n        LD (DE),A\n        INC DE\n        DEC HL\n        JR loop\ndone:   HALT\n",
  "swap-registers": "        ORG 0x8000\n        LD A,B\n        LD B,C\n        LD C,A\n        HALT\n",
  "gcd": "        ORG 0x8000\nloop:   CP B\n        JR Z,done\n        JR C,less\n        SUB B\n        JR loop\nless:   LD C,A\n        LD A,B\n        SUB C\n        LD B,A\n        LD A,C\n        JR loop\ndone:   HALT\n",
  "big-multiply": "        ORG 0x8000\n        LD HL,0\n        LD D,0\n        LD E,C\n        INC B\n        DEC B\n        JR Z,done\nloop:   ADD HL,DE\n        DJNZ loop\ndone:   HALT\n",
  "popcount": "        ORG 0x8000\n        LD B,0\n        LD C,8\nloop:   SRL A\n        JR NC,skip\n        INC B\nskip:   DEC C\n        JR NZ,loop\n        HALT\n",
  "string-compare": "        ORG 0x8000\n        LD B,0\nloop:   LD A,(DE)\n        CP (HL)\n        JR NZ,done\n        OR A\n        JR Z,same\n        INC HL\n        INC DE\n        JR loop\nsame:   LD B,1\ndone:   HALT\n",
  "bubble-sort": "        ORG 0x8000\n        LD C,B\n        DEC C\nouter:  PUSH HL\n        LD B,C\ninner:  LD A,(HL)\n        INC HL\n        CP (HL)\n        JR C,ok\n        JR Z,ok\n        LD D,(HL)\n        LD (HL),A\n        DEC HL\n        LD (HL),D\n        INC HL\nok:     DJNZ inner\n        POP HL\n        DEC C\n        JR NZ,outer\n        HALT\n",
  "fibonacci": "        ORG 0x8000\n        LD A,2\n        CALL 0x1601     ; open the main screen channel\n        LD B,10\n        LD D,0\n        LD E,1\nloop:   LD A,E\n        PUSH BC\n        LD C,A\n        LD B,0\n        CALL 0x2D2B\n        CALL 0x2DE3\n        POP BC\n        LD A,' '\n        RST 0x10\n        LD A,E\n        ADD A,D\n        LD D,E\n        LD E,A\n        DJNZ loop\n        HALT\n",
  "prime-check": "        ORG 0x8000\n        LD B,1\n        LD C,A\n        LD D,2\ntry:    LD A,D\n        CP C\n        JR Z,done\n        LD A,C\nrem:    CP D\n        JR C,remdone\n        SUB D\n        JR rem\nremdone: OR A\n        JR Z,composite\n        INC D\n        JR try\ncomposite: LD B,0\ndone:   HALT\n",
  "bcd-total": "        ORG 0x8000\n        XOR A\nloop:   ADD A,(HL)\n        DAA\n        INC HL\n        DJNZ loop\n        HALT\n",
  "record-total": "        ORG 0x8000\n        XOR A\n        LD DE,3\nloop:   ADD A,(IX+1)\n        ADD IX,DE\n        DJNZ loop\n        HALT\n",
  "insert-gap": "        ORG 0x8000\n        ADD HL,BC\n        DEC HL\n        LD D,H\n        LD E,L\n        INC DE\n        LDDR\n        INC HL\n        LD (HL),0\n        HALT\n",
}

export const lessonSolutions = Object.fromEntries(lessons.map((l) => [l.id, l.hints.at(-1).code]))

const solutions = { ...lessonSolutions, ...challengeSolutions }

export default solutions
