import { describe, expect, it } from 'bun:test'
import { compile } from './helpers.ts'
import { readFile } from './utils.ts'

describe('parser', () => {
  it('emits VM code using arithmetic precedence and parentheses', () => {
    const {
      constants: { Directive },
      VM,
    } = compile(readFile('../examples/expression'))

    expect(VM.directives()).toEqual([
      Directive.JMP,
      2,
      Directive.CONST,
      2,
      Directive.PUSH,
      Directive.CONST,
      3,
      Directive.PUSH,
      Directive.CONST,
      1,
      Directive.ADD,
      Directive.MUL,
    ])
  })

  it('emits store and load instructions for assignment expressions', () => {
    const {
      constants: { Directive },
      VM,
    } = compile('a = 1; a;')

    expect(VM.directives()).toEqual([
      Directive.JMP,
      2,
      Directive.CONST,
      1,
      Directive.STORE,
      'a',
      Directive.LOAD,
      'a',
    ])
  })

  it('emits a print directive for the minimal system call', () => {
    const {
      constants: { Directive },
      VM,
    } = compile('print(1 + 2);')

    expect(VM.directives()).toEqual([
      Directive.JMP,
      2,
      Directive.CONST,
      1,
      Directive.PUSH,
      Directive.CONST,
      2,
      Directive.ADD,
      Directive.PUSH,
      Directive.PRINT,
      1,
    ])
  })

  it('emits print directives for multiple arguments', () => {
    const {
      constants: { Directive },
      VM,
    } = compile('print("result =", 2);')

    const directives = VM.directives()

    expect(directives).toContain(Directive.PRINT)
    expect(directives.at(-1)).toBe(2)
    expect(directives.at(-2)).toBe(Directive.PRINT)
  })

  it('emits an assert directive for expression arguments', () => {
    const {
      constants: { Directive },
      VM,
    } = compile('assert(1 + 2 < 4);')

    expect(VM.directives()).toEqual([
      Directive.JMP,
      2,
      Directive.CONST,
      1,
      Directive.PUSH,
      Directive.CONST,
      2,
      Directive.ADD,
      Directive.PUSH,
      Directive.CONST,
      4,
      Directive.LT,
      Directive.ASSERT,
    ])
  })

  it('emits directives for clock and load system calls', () => {
    const {
      constants: { Directive },
      VM,
    } = compile('now = clock(); value = load("examples/assignment");')

    expect(VM.directives()).toEqual([
      Directive.JMP,
      2,
      Directive.CLOCK,
      Directive.STORE,
      'now',
      Directive.CONST,
      'examples/assignment',
      Directive.FILE,
      Directive.STORE,
      'value',
    ])
  })

  it('emits branch directives for while loops with expression bodies', () => {
    const {
      constants: { Directive },
      VM,
    } = compile(readFile('../examples/weighted-loop'))

    const directives = VM.directives()

    expect(directives).toContain(Directive.BZ)
    expect(directives).toContain(Directive.JMP)
    expect(directives).toContain(Directive.MUL)
    expect(directives.at(-3)).toBe(Directive.LOAD)
    expect(directives.at(-2)).toBe('i')
    expect(directives.at(-1)).toBe(Directive.ADD)
  })

  it('emits branch directives for if else blocks', () => {
    const {
      constants: { Directive },
      VM,
    } = compile(`value = 0;
if (value) {
  result = 1;
} else {
  result = 2;
}
result;`)

    const directives = VM.directives()

    expect(directives).toContain(Directive.BZ)
    expect(directives).toContain(Directive.JMP)
    expect(directives).toContain(Directive.STORE)
    expect(directives.at(-2)).toBe(Directive.LOAD)
    expect(directives.at(-1)).toBe('result')
  })

  it('emits call and return directives for functions', () => {
    const {
      constants: { Directive },
      VM,
    } = compile(`fn add(a, b) {
  return a + b;
}
result = add(1, 2);
result;`)

    const directives = VM.directives()

    expect(directives[0]).toBe(Directive.JMP)
    expect(directives).toContain(Directive.RET)
    expect(directives).toContain(Directive.CALL)
    expect(directives).toContain('add')
  })

  it('records source lines for trace steps', () => {
    const {
      constants: { Directive },
      VM,
    } = compile(readFile('../examples/weighted-loop'))

    const trace = VM.trace()

    expect(trace.find(step => step.op === Directive.CONST)?.sourceLine).toBe(1)
    expect(trace.find(step => step.op === Directive.BZ)?.sourceLine).toBe(3)
    expect(trace.find(step => step.op === Directive.MUL)?.sourceLine).toBe(4)
  })
})
