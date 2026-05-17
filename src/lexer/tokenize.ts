import { Source } from './source.ts'
import { TokenState } from './token-state.ts'
import { TokenKind } from './token-kind.ts'

function isDigit(chr: string | undefined) {
  return chr != null && chr >= '0' && chr <= '9'
}

function isAlpha(chr: string | undefined) {
  return chr != null && ((chr >= 'a' && chr <= 'z') || (chr >= 'A' && chr <= 'Z'))
}

function setToken(token: string | number, value: string | number | null = null) {
  TokenState.token = token
  TokenState.value = value
}

export function next() {
  while (!Source.eof()) {
    const ch = Source.read()
    // console.log('ch [', ch, ']')
    if (isDigit(ch)) {
      let value = (+ch)
      while (isDigit(Source.val)) {
        value = value * 10 + (+Source.read())
      }
      setToken(TokenKind.Number, value)

      return TokenState
    } else if (isAlpha(ch) || ch === '_') {
      let ident = ch
      while (isAlpha(Source.val) || Source.val === '_' || isDigit(Source.val)) {
        // console.log('isAlpha', Source.val, isAlpha(Source.val))
        ident += Source.read()
      }
      // console.log('ident', ident, TokenState.token, TokenKind.While)
      if (ident === 'while') setToken(TokenKind.While)
      else if (ident === 'if') setToken(TokenKind.If)
      else if (ident === 'else') setToken(TokenKind.Else)
      else if (ident === 'fn') setToken(TokenKind.Function)
      else if (ident === 'return') setToken(TokenKind.Return)
      else {
        setToken(TokenKind.Identifier, ident)
      }
      return TokenState
    }
    else if (ch === '+') { setToken(TokenKind.Add); return TokenState }
    else if (ch === '-') { setToken(TokenKind.Subtract); return TokenState }
    else if (ch === '*') { setToken(TokenKind.Multiply); return TokenState }
    else if (ch === '/') { setToken(TokenKind.Divide); return TokenState }
    else if (ch === '=') { setToken(TokenKind.Assign); return TokenState }
    else if (ch === '<') { setToken(TokenKind.LessThan); return TokenState }
    else if (ch === '(' || ch === ')' || ch === '{' || ch === '}' || ch === ';' || ch === ',') {
      setToken(ch)
      return TokenState
    }
  }

  return TokenState
}
