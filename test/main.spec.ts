import { describe, expect, it } from 'bun:test'
import { execute } from '../src/index.ts'
import { compile } from './helpers.ts'
import { readFile } from './utils.ts'

describe('language execution', () => {
  it('executes the assignment fixture', () => {
    const { Store, VM } = compile(readFile('../examples/assignment'))

    VM.execute()

    expect(Store.ax).toBe(3)
    expect(Store.env.get('a')).toBe(1)
    expect(Store.env.get('b')).toBe(3)
  })

  it('executes the loop fixture', () => {
    const { Store, VM } = compile(readFile('../examples/loop'))

    VM.execute()

    expect(Store.ax).toBe(1)
    expect(Store.env.get('i')).toBe(2)
    expect(Store.env.get('sum')).toBe(1)
  })

  it('executes the complex expression fixture', () => {
    const { Store, VM } = compile(readFile('../examples/complex-expression'))

    VM.execute()

    expect(Store.ax).toBe(41)
    expect(Store.env.get('base')).toBe(14)
    expect(Store.env.get('offset')).toBe(27)
  })

  it('executes the weighted loop fixture', () => {
    const { Store, VM } = compile(readFile('../examples/weighted-loop'))

    VM.execute()

    expect(Store.ax).toBe(16)
    expect(Store.env.get('i')).toBe(4)
    expect(Store.env.get('sum')).toBe(12)
  })

  it('executes the print flow fixture', () => {
    const logs: unknown[][] = []
    const originalLog = console.log
    console.log = (...values: unknown[]) => { logs.push(values) }

    try {
      const { Store, VM } = compile(readFile('../examples/print-flow'))

      VM.execute()

      expect(Store.ax).toBe(11)
      expect(Store.env.get('a')).toBe(7)
      expect(Store.env.get('b')).toBe(11)
      expect(logs).toEqual([[7]])
    } finally {
      console.log = originalLog
    }
  })

  it('executes the function call fixture', () => {
    const { Store, VM } = compile(readFile('../examples/function-call'))

    VM.execute()

    expect(Store.ax).toBe(11)
    expect(Store.env.get('result')).toBe(11)
  })

  it('executes the if else example', () => {
    const { Store, VM } = compile(readFile('../examples/if-else'))

    VM.execute()

    expect(Store.ax).toBe(2)
    expect(Store.env.get('result')).toBe(2)
  })

  it('executes the assertions example until the failed assertion', () => {
    const { VM } = compile(readFile('../examples/assertions'))

    expect(() => VM.execute()).toThrow('RUNTIME ERR: assert failed')
  })

  it('executes if and else branches', () => {
    expect(execute(`value = 0;
if (value) {
  result = 1;
} else {
  result = 2;
}
result;`)).toBe(2)

    expect(execute(`value = 1;
if (value) {
  result = 1;
} else {
  result = 2;
}
result;`)).toBe(1)
  })

  it('executes a function call through the public API', () => {
    const result = execute(`fn add(a, b) {
  return a + b;
}
add(1, 2);`)

    expect(result).toBe(3)
  })

  it('rejects function calls with the wrong arity', () => {
    expect(() => execute(`fn add(a, b) {
  return a + b;
}
add(1);`)).toThrow('RUNTIME ERR: add expected 2 args but got 1')
  })

  it('exposes a single public execute API', () => {
    const result = execute('a = 1; b = a + 2; b;')

    expect(result).toBe(3)
  })

  it('prints multiple arguments', () => {
    const logs: unknown[][] = []
    const originalLog = console.log
    console.log = (...values: unknown[]) => { logs.push(values) }

    try {
      execute('result = 2; print("result =", result);')

      expect(logs).toEqual([['result =', 2]])
    } finally {
      console.log = originalLog
    }
  })

  it('prints a value and returns it from execute', () => {
    const logs: unknown[][] = []
    const originalLog = console.log
    console.log = (...values: unknown[]) => { logs.push(values) }

    try {
      const result = execute('print(1 + 2);')

      expect(result).toBe(3)
      expect(logs).toEqual([[3]])
    } finally {
      console.log = originalLog
    }
  })

  it('executes assert system calls with expression arguments', () => {
    expect(execute('assert(1 + 2 < 4); 7;')).toBe(7)
  })

  it('executes clock system calls', () => {
    const now = Date.now
    Date.now = () => 123

    try {
      expect(execute('clock();')).toBe(123)
    } finally {
      Date.now = now
    }
  })

  it('rejects failed assertions', () => {
    expect(() => execute('assert(1 + 2 < 3);')).toThrow('RUNTIME ERR: assert failed')
  })
})
