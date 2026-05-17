import { describe, expect, it } from 'bun:test'
import { execute } from '../src/index.ts'
import { compile } from './helpers.ts'
import { readFile } from './utils.ts'

describe('language execution', () => {
  it('executes the assignment fixture', () => {
    const { Store, VM } = compile(readFile('../fixture/assignment'))

    VM.execute()

    expect(Store.ax).toBe(3)
    expect(Store.env.get('a')).toBe(1)
    expect(Store.env.get('b')).toBe(3)
  })

  it('executes the loop fixture', () => {
    const { Store, VM } = compile(readFile('../fixture/loop'))

    VM.execute()

    expect(Store.ax).toBe(1)
    expect(Store.env.get('i')).toBe(2)
    expect(Store.env.get('sum')).toBe(1)
  })

  it('executes the complex expression fixture', () => {
    const { Store, VM } = compile(readFile('../fixture/complex-expression'))

    VM.execute()

    expect(Store.ax).toBe(41)
    expect(Store.env.get('base')).toBe(14)
    expect(Store.env.get('offset')).toBe(27)
  })

  it('executes the weighted loop fixture', () => {
    const { Store, VM } = compile(readFile('../fixture/weighted-loop'))

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
      const { Store, VM } = compile(readFile('../fixture/print-flow'))

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
    const { Store, VM } = compile(readFile('../fixture/function-call'))

    VM.execute()

    expect(Store.ax).toBe(11)
    expect(Store.env.get('result')).toBe(11)
  })

  it('executes a function call through the public API', () => {
    const result = execute(`fn add(a, b) {
  return a + b;
}
add(1, 2);`)

    expect(result).toBe(3)
  })

  it('exposes a single public execute API', () => {
    const result = execute('a = 1; b = a + 2; b;')

    expect(result).toBe(3)
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
})
