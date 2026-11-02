"""Compare our JS Z80 core against the reference `z80` Python package.

Run:  pip install -r tools/requirements.txt   then   python -I tools/compare_cpu.py
(use a virtual environment; any directory works)
Builds many (instruction, register, flag) cases, runs each on the reference
machine, then hands the cases + expected results to compare_cpu.mjs, which runs
the same cases on src/z80/cpu.js and reports mismatches.

Flag bits 3 and 5 (undocumented X/Y) are not modelled by our CPU, so they are
masked by default (pass --strict to compare them too).
"""
import json, random, subprocess, sys
from pathlib import Path
import z80

HERE = Path(__file__).parent
random.seed(1234)
ORG, PTR = 0x8000, 0x9000
INTERESTING = [0, 1, 2, 3, 0x0E, 0x0F, 0x10, 0x11, 0x3C, 0x55, 0x7E, 0x7F, 0x80, 0x81, 0x8F, 0x90, 0xAA, 0xF0, 0xFE, 0xFF]
VALS = sorted(set(INTERESTING + random.sample(range(256), 12)))
REGS = {'B': 0, 'C': 1, 'D': 2, 'E': 3, 'H': 4, 'L': 5, '(HL)': 6, 'A': 7}
STATE_KEYS = ['a', 'f', 'b', 'c', 'd', 'e', 'h', 'l', 'sp', 'pc', 'ix', 'iy',
              'alt_a', 'alt_f', 'alt_b', 'alt_c', 'alt_d', 'alt_e', 'alt_h', 'alt_l']

cases = []

def add(name, code, **init):
    init.setdefault('f', random.randrange(256))
    cases.append({'name': name, 'code': list(code), 'init': init})

def with_val(reg, v, init):
    """Place operand v in register `reg` (or memory at HL)."""
    if reg == '(HL)':
        init['h'], init['l'] = PTR >> 8, PTR & 0xFF
        init['mem'] = v
    elif reg == 'H':
        init['h'] = v
    elif reg == 'L':
        init['l'] = v
    else:
        init[reg.lower()] = v

ALU = ['ADD', 'ADC', 'SUB', 'SBC', 'AND', 'XOR', 'OR', 'CP']
for i, op in enumerate(ALU):
    for a in VALS:
        for v in VALS:
            for cf in (0, 1):
                f = random.randrange(256) & ~1 | cf
                add(f'{op} A,n a={a:02X} n={v:02X} c={cf}', [0xC6 | (i << 3), v], a=a, f=f)
                for reg in ('B', '(HL)', 'A'):
                    init = {'a': a, 'f': f}
                    with_val(reg, v, init)
                    if reg == 'A':
                        init['a'] = v
                    add(f'{op} A,{reg} a={init["a"]:02X} v={v:02X} c={cf}', [0x80 | (i << 3) | REGS[reg]], **init)

for reg, r in REGS.items():
    for v in range(256):
        for cf in (0, 1):
            for nm, base in (('INC', 0x04), ('DEC', 0x05)):
                init = {'f': random.randrange(256) & ~1 | cf}
                with_val(reg, v, init)
                add(f'{nm} {reg} v={v:02X} c={cf}', [base | (r << 3)], **init)

for a in range(256):
    for cf in (0, 1):
        f = random.randrange(256) & ~1 | cf
        for nm, code in (('RLCA', 0x07), ('RRCA', 0x0F), ('RLA', 0x17), ('RRA', 0x1F),
                         ('CPL', 0x2F), ('SCF', 0x37), ('CCF', 0x3F)):
            add(f'{nm} a={a:02X} c={cf}', [code], a=a, f=f)
    add(f'NEG a={a:02X}', [0xED, 0x44], a=a)

SHIFTS = ['RLC', 'RRC', 'RL', 'RR', 'SLA', 'SRA', 'SLL', 'SRL']
for reg in ('B', '(HL)', 'A'):
    r = REGS[reg]
    for v in range(256):
        for cf in (0, 1):
            f = random.randrange(256) & ~1 | cf
            for k, nm in enumerate(SHIFTS):
                init = {'f': f}; with_val(reg, v, init)
                add(f'{nm} {reg} v={v:02X} c={cf}', [0xCB, (k << 3) | r], **init)
            for bit in range(8):
                for nm, base in (('BIT', 0x40), ('RES', 0x80), ('SET', 0xC0)):
                    init = {'f': f}; with_val(reg, v, init)
                    add(f'{nm} {bit},{reg} v={v:02X} c={cf}', [0xCB, base | (bit << 3) | r], **init)

for hl in VALS * 8 + [0, 0xFFFF, 0x0FFF, 0x1000, 0x8000]:
    for rr, (nm, base) in enumerate((('BC', 0), ('DE', 1), ('HL', 2), ('SP', 3))):
        for v in (0, 1, 0x0FFF, 0x1000, 0x7FFF, 0x8000, 0xFFFF, random.randrange(65536)):
            init = {'h': hl >> 8 & 0xFF, 'l': hl & 0xFF, 'f': random.randrange(256)}
            if nm == 'BC': init['b'], init['c'] = v >> 8, v & 0xFF
            elif nm == 'DE': init['d'], init['e'] = v >> 8, v & 0xFF
            elif nm == 'SP': init['sp'] = v
            if nm == 'HL': v = hl
            add(f'ADD HL,{nm} hl={hl:04X} v={v:04X}', [0x09 | (rr << 4)], **init)
for v in (0, 1, 0x00FF, 0x0100, 0x7FFF, 0x8000, 0xFFFF):
    for rr in range(4):
        for base in (0x03, 0x0B):
            init = {'f': random.randrange(256), 'b': v >> 8, 'c': v & 0xFF, 'd': v >> 8, 'e': v & 0xFF,
                    'h': v >> 8, 'l': v & 0xFF, 'sp': v}
            add(f'{"INC" if base == 3 else "DEC"} rr{rr} v={v:04X}', [base | (rr << 4)], **init)

for n in (1, 2, 3, 5):
    for op, nm in ((0xB0, 'LDIR'), (0xB8, 'LDDR')):
        add(f'{nm} bc={n}', [0xED, op], b=0, c=n, d=PTR + 0x100 >> 8, e=0x08, h=PTR >> 8, l=0x08, mem=0x5A)

# ---- control flow, loads, stack ---------------------------------------------
CC = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M']
lo = lambda v: v & 0xFF
hi = lambda v: v >> 8 & 0xFF
for f in range(256):
    for cc in range(8):
        T = ORG + 5
        add(f'JP {CC[cc]} f={f:02X}', [0xC2 | cc << 3, lo(T), hi(T), 0x3E, 1, 0x76], f=f)
        T = ORG + 4
        add(f'CALL {CC[cc]} f={f:02X}', [0xC4 | cc << 3, lo(T), hi(T), 0x76, 0x3C, 0xC9], f=f)
        add(f'RET {CC[cc]} f={f:02X}', [0x21, lo(ORG + 7), hi(ORG + 7), 0xE5, 0xC0 | cc << 3, 0x3E, 1, 0x76], f=f)
        if cc < 4:
            add(f'JR {CC[cc]} f={f:02X}', [0x20 | cc << 3, 2, 0x3E, 1, 0x76], f=f)
for b in (0, 1, 2, 3, 7, 255):
    add(f'DJNZ b={b}', [0x3E, 0, 0x3C, 0x10, 0xFD, 0x76], b=b)
add('JR', [0x18, 2, 0x3E, 1, 0x76])
add('JP nn', [0xC3, lo(ORG + 5), hi(ORG + 5), 0x3E, 1, 0x76])
add('CALL nn', [0xCD, lo(ORG + 4), hi(ORG + 4), 0x76, 0x3C, 0xC9])
add('JP (HL)', [0x21, lo(ORG + 5), hi(ORG + 5), 0xE9, 0x3E, 0x76], a=1)  # lands on the final HALT? target = ORG+5
add('EX DE,HL', [0xEB], d=0x12, e=0x34, h=0x56, l=0x78)
add('LD SP,HL', [0xF9], h=0x9A, l=0xBC)

PAIRS = {'BC': (0xC5, 0xC1), 'DE': (0xD5, 0xD1), 'HL': (0xE5, 0xE1), 'AF': (0xF5, 0xF1)}
for x, (push, _) in PAIRS.items():
    for y, (_, pop) in PAIRS.items():
        for _ in range(8):
            add(f'PUSH {x} POP {y}', [push, pop], a=random.randrange(256), b=random.randrange(256), c=random.randrange(256),
                d=random.randrange(256), e=random.randrange(256), h=random.randrange(256), l=random.randrange(256))

vals8 = [0, 1, 0x7F, 0x80, 0xFF, 0x5A]
for d, dn in REGS.items():
    for sname, sn in REGS.items():
        if d == '(HL)' and sname == '(HL)':
            continue
        for v in vals8:
            init = {'a': 0x11, 'b': 0x22, 'c': 0x33, 'd': 0x44, 'e': 0x55}
            init['h'], init['l'] = PTR >> 8, PTR & 0xFF
            if sname == '(HL)':
                init['mem'] = v
            else:
                init[sname.lower()] = v
            if sname in ('H', 'L') or d in ('H', 'L'):
                init['h'], init['l'] = PTR >> 8, (PTR & 0xFF) + 3
            add(f'LD {d},{sname} v={v:02X}', [0x40 | dn << 3 | sn], **init)
        add(f'LD {d},n', [0x06 | dn << 3, 0xA5], h=PTR >> 8, l=PTR & 0xFF)

for rr, base in enumerate((0x01, 0x11, 0x21, 0x31)):
    add(f'LD rr{rr},nn', [base, 0x34, 0x12])
add('LD (BC),A', [0x02], a=0x77, b=PTR >> 8, c=0x04)
add('LD (DE),A', [0x12], a=0x78, d=PTR >> 8, e=0x05)
add('LD A,(BC)', [0x0A], b=PTR >> 8, c=0x06)
add('LD A,(DE)', [0x1A], d=PTR >> 8, e=0x07)
add('LD (nn),A', [0x32, 0x08, PTR >> 8], a=0x99)
add('LD A,(nn)', [0x3A, 0x09, PTR >> 8])
add('LD (nn),HL', [0x22, 0x0A, PTR >> 8], h=0xAB, l=0xCD)
add('LD HL,(nn)', [0x2A, 0x0B, PTR >> 8])
for n in (0, 1, 2, 3):
    add(f'LDDR bc={n or 5}', [0xED, 0xB8], b=0, c=n or 5, d=PTR + 0x100 >> 8, e=0x0C, h=PTR >> 8, l=0x0C)

# ---- extended instructions: 16-bit carry maths, block search, BCD, shadow registers, IX/IY ----
def pair_init(name, v, init):
    if name == 'BC': init['b'], init['c'] = v >> 8, v & 0xFF
    elif name == 'DE': init['d'], init['e'] = v >> 8, v & 0xFF
    elif name == 'SP': init['sp'] = v

V16 = [0, 1, 0x0FFF, 0x1000, 0x7FFF, 0x8000, 0x8001, 0xFFFF, 0x1234, 0xF0F0]
for hl in V16:
    for rr, nm in enumerate(('BC', 'DE', 'HL', 'SP')):
        for v in V16:
            for cf in (0, 1):
                for op, base in (('ADC', 0x4A), ('SBC', 0x42)):
                    init = {'h': hl >> 8, 'l': hl & 0xFF, 'f': random.randrange(256) & ~1 | cf}
                    pair_init(nm, v, init)
                    add(f'{op} HL,{nm} hl={hl:04X} v={v:04X} c={cf}', [0xED, base | rr << 4], **init)

for rr, nm in enumerate(('BC', 'DE', 'HL', 'SP')):
    add(f'LD (nn),{nm} ED', [0xED, 0x43 | rr << 4, 0x20, PTR >> 8], b=0x11, c=0x22, d=0x33, e=0x44, h=0x55, l=0x66, sp=0x7788)
    add(f'LD {nm},(nn) ED', [0xED, 0x4B | rr << 4, 0x03, PTR >> 8])

add('EX (SP),HL', [0x21, 0x34, 0x12, 0xE5, 0x21, 0x78, 0x56, 0xE3])
add('EXX', [0xD9], a=1, b=2, c=3, d=4, e=5, h=6, l=7, alt_a=0x11, alt_b=0x12, alt_c=0x13, alt_d=0x14, alt_e=0x15, alt_h=0x16, alt_l=0x17)
add("EX AF,AF'", [0x08], a=0x80, f=0xAB, alt_a=0x7F, alt_f=0x45)
add('EXX twice', [0xD9, 0xD9], b=2, c=3, d=4, e=5, h=6, l=7, alt_b=0x12, alt_c=0x13)

for nm, op in (('LDI', 0xA0), ('LDD', 0xA8)):
    for n in (1, 2):
        add(f'{nm} bc={n}', [0xED, op], b=0, c=n, d=PTR + 0x100 >> 8, e=0x08, h=PTR >> 8, l=0x08, f=random.randrange(256))
for nm, op in (('CPI', 0xA1), ('CPD', 0xA9), ('CPIR', 0xB1), ('CPDR', 0xB9)):
    for a in (0, 3, 5, 9, 0x80, 0xFF):
        for n in (1, 2, 6, 20):
            for cf in (0, 1):
                add(f'{nm} a={a:02X} bc={n} c={cf}', [0xED, op], a=a, b=0, c=n, h=PTR >> 8, l=0x08, f=random.randrange(256) & ~1 | cf)

for a in range(256):
    for fl in range(8):
        f = random.randrange(256) & ~0x13 | (fl & 1) | (fl >> 1 & 1) << 4 | (fl >> 2 & 1) << 1
        add(f'DAA a={a:02X} f={f:02X}', [0x27], a=a, f=f)

for portc in (0, 1, 2):
    for r, nm in enumerate(('B', 'C', 'D', 'E', 'H', 'L', '(HL)', 'A')):
        if r != 6:
            add(f'OUT (C),{nm} port={portc}', [0xED, 0x41 | r << 3], a=5, b=6, c=portc, d=7, e=8, h=9, l=10)

for pre, ix in ((0xDD, 'ix'), (0xFD, 'iy')):
    nmx = ix.upper()
    add(f'LD {nmx},nn', [pre, 0x21, 0x34, 0x12], f=7)
    add(f'LD {nmx},(nn)', [pre, 0x2A, 0x04, PTR >> 8])
    add(f'LD (nn),{nmx}', [pre, 0x22, 0x30, PTR >> 8], **{ix: 0xBEEF})
    for v in (0, 0xFFFF, 0x7FFF):
        add(f'INC {nmx} v={v:04X}', [pre, 0x23], f=0x55, **{ix: v})
        add(f'DEC {nmx} v={v:04X}', [pre, 0x2B], f=0x55, **{ix: v})
    for rr, rn in ((0, 'BC'), (1, 'DE'), (2, nmx), (3, 'SP')):
        for xv in V16:
            for v in V16:
                init = {ix: xv, 'f': random.randrange(256)}
                pair_init(rn, v, init)
                if rn == nmx: v = xv
                add(f'ADD {nmx},{rn} x={xv:04X} v={v:04X}', [pre, 0x09 | rr << 4], **init)
    for d in (-128, -1, 0, 1, 127):
        # these windows stay inside PTR..PTR+0x110 by pointing the register at the middle of it
        mid = PTR + 0x80
        for r, rn in ((0, 'B'), (1, 'C'), (2, 'D'), (3, 'E'), (4, 'H'), (5, 'L'), (7, 'A')):
            add(f'LD {rn},({nmx}{d:+d})', [pre, 0x46 | r << 3, d & 0xFF], **{ix: mid})
            add(f'LD ({nmx}{d:+d}),{rn}', [pre, 0x70 | r, d & 0xFF], a=0xA1, b=0xB2, c=0xC3, d=0xD4, e=0xE5, h=0x16, l=0x27, **{ix: mid})
        add(f'LD ({nmx}{d:+d}),n', [pre, 0x36, d & 0xFF, 0x9C], **{ix: mid})
        for v in (0, 0x7F, 0x80, 0xFF, 0x0F):
            for nm2, opc in (('INC', 0x34), ('DEC', 0x35)):
                add(f'{nm2} ({nmx}{d:+d}) v={v:02X}', [pre, opc, d & 0xFF], f=random.randrange(256), **{ix: mid}, mem_at=(mid + d, v))
        for i, op in enumerate(ALU):
            for a in (0, 1, 0x7F, 0x80, 0xFF):
                for cf in (0, 1):
                    add(f'{op} A,({nmx}{d:+d}) a={a:02X} c={cf}', [pre, 0x86 | i << 3, d & 0xFF], a=a, f=random.randrange(256) & ~1 | cf, **{ix: mid}, mem_at=(mid + d, 0x8F))
        for k, nm2 in enumerate(SHIFTS):
            for v in (0, 1, 0x80, 0xA5, 0xFF):
                for cf in (0, 1):
                    add(f'{nm2} ({nmx}{d:+d}) v={v:02X} c={cf}', [pre, 0xCB, d & 0xFF, k << 3 | 6], f=random.randrange(256) & ~1 | cf, **{ix: mid}, mem_at=(mid + d, v))
        for bit in range(8):
            for nm2, b0 in (('BIT', 0x40), ('RES', 0x80), ('SET', 0xC0)):
                for v in (0, 0xFF, 0x55):
                    add(f'{nm2} {bit},({nmx}{d:+d}) v={v:02X}', [pre, 0xCB, d & 0xFF, b0 | bit << 3 | 6], f=random.randrange(256), **{ix: mid}, mem_at=(mid + d, v))
    add(f'PUSH {nmx} POP BC', [pre, 0xE5, 0xC1], **{ix: 0xCAFE})
    add(f'PUSH BC POP {nmx}', [0xC5, pre, 0xE1], b=0x12, c=0x34)
    add(f'JP ({nmx}) lands', [0x3E, 7, pre, 0xE9, 0, 0, 0x3C], **{ix: ORG + 6})
    add(f'LD SP,{nmx}', [pre, 0xF9], **{ix: 0xE000})
    add(f'EX (SP),{nmx}', [0x21, 0x34, 0x12, 0xE5, pre, 0xE3], **{ix: 0xABCD})


def run_ref(case):
    m = z80.Z80Machine()
    m.set_memory_block(ORG, bytes(case['code'] + [0x76]))
    init = case['init']
    m.sp = init.get('sp', 0xF000)
    for k, v in init.items():
        if k not in ('mem', 'sp', 'mem_at'):
            setattr(m, k, v)
    scratch = list(range(16))
    if 'mem' in init:
        scratch[0] = init['mem']
    m.set_memory_block(PTR, bytes(scratch))
    m.set_memory_block(PTR + 0x100, bytes(16))
    if 'mem_at' in init:
        m.set_memory_block(init['mem_at'][0], bytes([init['mem_at'][1]]))
    m.pc = ORG
    m.ticks_to_stop = 100000
    m.run()
    assert m.halted, case['name']
    out = {k: getattr(m, k) for k in STATE_KEYS}
    out['pc'] = m.pc
    out['mem'] = list(m.memory[PTR:PTR + 0x110]) + list(m.memory[0xEFF0:0xF000])
    return out

for c in cases:
    c['expect'] = run_ref(c)

strict = '--strict' in sys.argv
(HERE / 'cases.json').write_text(json.dumps({'cases': cases, 'strict': strict, 'ptr': PTR, 'org': ORG}))
print(f'{len(cases)} cases built from reference z80; running JS core...', flush=True)
try:
    code = subprocess.call(['node', str(HERE / 'compare_cpu.mjs')])
finally:
    (HERE / 'cases.json').unlink(missing_ok=True)  # the JS side removes it on success; tidy up after a crash too
sys.exit(code)
