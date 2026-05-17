import { describe, expect, it } from 'bun:test'
import { runtime } from './helpers.ts'

describe('tokenizer', () => {
  it('recognizes keywords, identifiers, operators, and numbers', () => {
    const {
      constants: { TokenKind },
      next,
      Source,
      TokenState,
    } = runtime('')

    Source.initialize('while (count_1 < 42) {}')

    next()
    expect(TokenState.token).toBe(TokenKind.While)

    next()
    expect(TokenState.token).toBe('(')
    expect(TokenState.value).toBe(null)

    next()
    expect(TokenState.token).toBe(TokenKind.Identifier)
    expect(TokenState.value).toBe('count_1')

    next()
    expect(TokenState.token).toBe(TokenKind.LessThan)
    expect(TokenState.value).toBe(null)

    next()
    expect(TokenState.token).toBe(TokenKind.Number)
    expect(TokenState.value).toBe(42)
  })

  it('recognizes function and return keywords', () => {
    const {
      constants: { TokenKind },
      next,
      Source,
      TokenState,
    } = runtime('')

    Source.initialize('fn add() { return 1; }')

    next()
    expect(TokenState.token).toBe(TokenKind.Function)

    next()
    expect(TokenState.token).toBe(TokenKind.Identifier)
    expect(TokenState.value).toBe('add')

    next()
    expect(TokenState.token).toBe('(')

    next()
    expect(TokenState.token).toBe(')')

    next()
    expect(TokenState.token).toBe('{')

    next()
    expect(TokenState.token).toBe(TokenKind.Return)
  })

  it('recognizes string literals', () => {
    const {
      constants: { TokenKind },
      next,
      Source,
      TokenState,
    } = runtime('')

    Source.initialize('load("examples/assignment")')

    next()
    expect(TokenState.token).toBe(TokenKind.Identifier)
    expect(TokenState.value).toBe('load')

    next()
    expect(TokenState.token).toBe('(')

    next()
    expect(TokenState.token).toBe(TokenKind.String)
    expect(TokenState.value).toBe('examples/assignment')
  })
})
