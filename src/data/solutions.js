// Reference solutions, one per challenge id. Used by the unit tests only and never
// imported by the app, so they are not included in the shipped bundle.

const solutions = {
  "load-a": "        ORG 0x8000\n        LD A,42\n        HALT\n",
  "copy-registers": "        ORG 0x8000\n        LD C,B\n        LD D,B\n        HALT\n",
  "add-two": "        ORG 0x8000\n        ADD A,B\n        HALT\n",
  "subtract": "        ORG 0x8000\n        SUB B\n        HALT\n",
  "inc-dec": "        ORG 0x8000\n        LD C,B\n        INC C\n        LD D,B\n        DEC D\n        HALT\n",
  "bit-twiddle": "        ORG 0x8000\n        SET 7,A\n        RES 0,A\n        HALT\n",
  "print-char": "        ORG 0x8000\n        LD A,'Z'\n        OUT (0),A\n        HALT\n",
  "print-hello": "        ORG 0x8000\n        LD HL,msg\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        OUT (0),A\n        INC HL\n        JR next\ndone:   HALT\nmsg:    DB \"Hello, Z80!\",0\n",
  "print-number": "        ORG 0x8000\n        LD A,B\n        OUT (1),A\n        HALT\n",
  "count-up": "        ORG 0x8000\n        LD B,1\nloop:   LD A,B\n        OUT (1),A\n        OUT (2),A\n        INC B\n        LD A,B\n        CP 11\n        JR NZ,loop\n        HALT\n",
  "countdown": "        ORG 0x8000\n        LD B,10\nloop:   LD A,B\n        OUT (1),A\n        OUT (2),A\n        DJNZ loop\n        LD HL,msg\nnext:   LD A,(HL)\n        OR A\n        JR Z,done\n        OUT (0),A\n        INC HL\n        JR next\ndone:   HALT\nmsg:    DB \"Liftoff!\",0\n",
  "sum-to-n": "        ORG 0x8000\n        XOR A\nloop:   ADD A,B\n        DJNZ loop\n        HALT\n",
  "multiply": "        ORG 0x8000\n        XOR A\n        INC B\n        DEC B\n        JR Z,done\nloop:   ADD A,C\n        DJNZ loop\ndone:   HALT\n",
  "max-of-two": "        ORG 0x8000\n        CP B\n        JR NC,done\n        LD A,B\ndone:   HALT\n",
  "even-odd": "        ORG 0x8000\n        LD B,1\n        BIT 0,A\n        JR Z,done\n        LD B,0\ndone:   HALT\n",
  "absolute-value": "        ORG 0x8000\n        BIT 7,A\n        JR Z,done\n        NEG\ndone:   HALT\n",
  "fizzbuzz": "        ORG 0x8000\n        LD A,H\n        LD (limit),A\n        LD B,1\n        LD C,3\n        LD D,5\nloop:   LD E,0\n        DEC C\n        JR NZ,not3\n        LD C,3\n        SET 0,E\n        LD HL,fizz\n        CALL puts\nnot3:   DEC D\n        JR NZ,not5\n        LD D,5\n        SET 1,E\n        LD HL,buzz\n        CALL puts\nnot5:   LD A,E\n        OR A\n        JR NZ,eol\n        LD A,B\n        OUT (1),A\neol:    OUT (2),A\n        LD A,(limit)\n        CP B\n        JR Z,finish\n        INC B\n        JR loop\nfinish: HALT\nputs:   LD A,(HL)\n        OR A\n        RET Z\n        OUT (0),A\n        INC HL\n        JR puts\nfizz:   DB \"Fizz\",0\nbuzz:   DB \"Buzz\",0\nlimit:  DB 0\n",
  "fill-memory": "        ORG 0x8000\nloop:   LD (HL),A\n        INC HL\n        DJNZ loop\n        HALT\n",
  "copy-block": "        ORG 0x8000\n        LDIR\n        HALT\n",
  "sum-array": "        ORG 0x8000\n        XOR A\nloop:   ADD A,(HL)\n        INC HL\n        DJNZ loop\n        HALT\n",
  "largest-in-array": "        ORG 0x8000\n        LD A,(HL)\n        INC HL\n        DEC B\n        JR Z,done\nloop:   CP (HL)\n        JR NC,skip\n        LD A,(HL)\nskip:   INC HL\n        DJNZ loop\ndone:   HALT\n",
  "count-zeros": "        ORG 0x8000\n        LD C,0\nloop:   LD A,(HL)\n        OR A\n        JR NZ,skip\n        INC C\nskip:   INC HL\n        DJNZ loop\n        HALT\n",
  "string-length": "        ORG 0x8000\n        LD B,0\nloop:   LD A,(HL)\n        OR A\n        JR Z,done\n        INC B\n        INC HL\n        JR loop\ndone:   HALT\n",
  "subroutine": "        ORG 0x8000\n        CALL double\n        CALL double\n        CALL double\n        HALT\ndouble: ADD A,A\n        RET\n",
  "reverse-string": "        ORG 0x8000\n        LD D,H\n        LD E,L\n        LD C,B\n        LD B,0\n        ADD HL,BC\n        DEC HL\nloop:   LD A,H\n        CP D\n        JR C,done\n        JR NZ,swap\n        LD A,L\n        CP E\n        JR C,done\n        JR Z,done\nswap:   LD A,(DE)\n        LD C,(HL)\n        LD (HL),A\n        LD A,C\n        LD (DE),A\n        INC DE\n        DEC HL\n        JR loop\ndone:   HALT\n",
  "stack-swap": "        ORG 0x8000\n        PUSH BC\n        PUSH DE\n        POP BC\n        POP DE\n        HALT\n",
  "swap-registers": "        ORG 0x8000\n        LD A,B\n        LD B,C\n        LD C,A\n        HALT\n",
}

export default solutions
