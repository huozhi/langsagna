import { describe, expect, it } from 'bun:test'
import { runtime } from './helpers.ts'

describe('vm', () => {
  it('loads and executes arithmetic bytecode', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      3,
      Directive.PUSH,
      Directive.CONST,
      20,
      Directive.ADD,
      Directive.EXIT,
    ])
    VM.execute()

    expect(Store.ax).toBe(23)
  })

  it('records execution trace steps', () => {
    const {
      constants: { Directive },
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      1,
      Directive.PUSH,
      Directive.CONST,
      2,
      Directive.ADD,
      Directive.EXIT,
    ])

    const trace = VM.trace()

    expect(trace.map(step => step.op)).toEqual([
      Directive.CONST,
      Directive.PUSH,
      Directive.CONST,
      Directive.ADD,
      Directive.EXIT,
    ])
    expect(trace.at(-1)?.after.ax).toBe(3)
    expect(trace.at(-1)?.after.vs).toEqual([])
  })

  it('executes assert directives', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      1,
      Directive.ASSERT,
      Directive.EXIT,
    ])
    VM.execute()

    expect(Store.ax).toBe(1)
  })

  it('executes clock directives', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')
    const now = Date.now
    Date.now = () => 123

    try {
      VM.emitAll([
        Directive.CLOCK,
        Directive.EXIT,
      ])
      VM.execute()

      expect(Store.ax).toBe(123)
    } finally {
      Date.now = now
    }
  })

  it('executes file directives', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      'examples/assignment',
      Directive.FILE,
      Directive.EXIT,
    ])
    VM.execute()

    expect(Store.ax).toBe('a = 1;\nb = 2 + a;')
  })

  it('throws when assert receives a falsy value', () => {
    const {
      constants: { Directive },
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      0,
      Directive.ASSERT,
      Directive.EXIT,
    ])

    expect(() => VM.execute()).toThrow('RUNTIME ERR: assert failed')
  })

  it('executes call and return directives', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')

    VM.emit(Directive.JMP)
    const mainTarget = VM.position()
    VM.emit(null)

    // This test bypasses the parser: registerFn defines the function
    // metadata, and CALL binds the pushed arguments to the frame locals a/b.
    VM.registerFn('add', ['a', 'b'], VM.position())
    VM.emitAll([
      Directive.LOAD,
      'a',
      Directive.PUSH,
      Directive.LOAD,
      'b',
      Directive.ADD,
      Directive.RET,
    ])

    VM.patch(mainTarget, VM.position())
    VM.emitAll([
      Directive.CONST,
      1,
      Directive.PUSH,
      Directive.CONST,
      2,
      Directive.PUSH,
      Directive.CALL,
      'add',
      2,
      Directive.EXIT,
    ])
    VM.execute()

    expect(Store.ax).toBe(3)
    expect(Store.cs).toEqual([])
  })

  it('checks call arity', () => {
    const {
      constants: { Directive },
      VM,
    } = runtime('')

    VM.emit(Directive.JMP)
    const mainTarget = VM.position()
    VM.emit(null)

    VM.registerFn('add', ['a', 'b'], VM.position())
    VM.emitAll([
      Directive.RET,
    ])

    VM.patch(mainTarget, VM.position())
    VM.emitAll([
      Directive.CONST,
      1,
      Directive.PUSH,
      Directive.CALL,
      'add',
      1,
      Directive.EXIT,
    ])

    expect(() => VM.execute()).toThrow('RUNTIME ERR: add expected 2 args but got 1')
  })

  it('executes branch and jump directives', () => {
    const {
      constants: { Directive },
      Store,
      VM,
    } = runtime('')

    VM.emitAll([
      Directive.CONST,
      0,
      Directive.BZ,
      8,
      Directive.CONST,
      99,
      Directive.JMP,
      10,
      Directive.CONST,
      42,
      Directive.EXIT,
    ])
    VM.execute()

    expect(Store.ax).toBe(42)
  })
})
