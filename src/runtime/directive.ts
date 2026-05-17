export const Directive = {
  CONST:  'CONST',   // ax = literal operand
  LOAD:   'LOAD',    // ax = local/env value by name
  STORE:  'STORE',   // local/env name = ax
  PUSH:   'PUSH',    // push ax onto the value stack
  JMP:    'JMP',     // pc = target operand
  BZ:     'BZ',      // branch to target operand when ax is falsy
  ADD:    'ADD',     // ax = value stack pop + ax
  SUB:    'SUB',     // ax = value stack pop - ax
  MUL:    'MUL',     // ax = value stack pop * ax
  DIV:    'DIV',     // ax = value stack pop / ax
  LT:     'LT',      // ax = value stack pop < ax ? 1 : 0
  PRINT:  'PRINT',   // print ax
  CALL:   'CALL',    // call function operand with argc operand
  RET:    'RET',     // return to current call frame ret
  EXIT:   'EXIT',    // stop execution
} as const

export type DirectiveName = typeof Directive[keyof typeof Directive]
