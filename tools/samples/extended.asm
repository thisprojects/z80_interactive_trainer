; Instruction forms added for the lessons: 16-bit carry maths, block search, BCD, shadow registers, IX/IY.
        ORG 0x8000
        ADC HL,BC
        ADC HL,DE
        ADC HL,HL
        ADC HL,SP
        SBC HL,BC
        SBC HL,SP
        LD (0x9000),BC
        LD (0x9000),DE
        LD (0x9000),SP
        LD BC,(0x9000)
        LD DE,(0x9000)
        LD SP,(0x9000)
        EX (SP),HL
        EX AF,AF'
        EXX
        LDI
        LDD
        CPI
        CPD
        CPIR
        CPDR
        DAA
        OUT (C),A
        OUT (C),B
        LD IX,0x1234
        LD IY,0x1234
        LD IX,(0x9000)
        LD (0x9000),IY
        INC IX
        DEC IY
        ADD IX,BC
        ADD IX,DE
        ADD IX,IX
        ADD IX,SP
        ADD IY,IY
        PUSH IX
        POP IY
        JP (IX)
        JP (IY)
        LD SP,IX
        EX (SP),IX
        EX (SP),IY
        LD A,(IX+5)
        LD B,(IY-3)
        LD H,(IX)
        LD (IX+1),C
        LD (IY+127),A
        LD (IX-128),E
        LD (IX+2),0x55
        INC (IX+4)
        DEC (IY-4)
        ADD A,(IX+1)
        ADC A,(IX+2)
        SUB (IX+3)
        SBC A,(IY+3)
        AND (IX+4)
        XOR (IX+5)
        OR (IY+6)
        CP (IX+7)
        RLC (IX+1)
        SRL (IY-2)
        BIT 3,(IX+5)
        RES 0,(IY+1)
        SET 7,(IX-1)
