import { Directive, type DirectiveName } from './directive.ts'
import { Store, type RuntimeValue } from './storage.ts'
import { error } from '../error.ts'

export type DirectiveItem = DirectiveName | RuntimeValue

type VmSnapshot = {
  pc: number
  ax: RuntimeValue
  vs: RuntimeValue[]
  env: Record<string, RuntimeValue>
}

export type VmTraceStep = {
  pc: number
  op: DirectiveItem
  operands: DirectiveItem[]
  sourceLine: number | null
  before: VmSnapshot
  after: VmSnapshot
}

const directiveOperands: Partial<Record<DirectiveName, number>> = {
  [Directive.CONST]: 1,
  [Directive.LOAD]: 1,
  [Directive.STORE]: 1,
  [Directive.JMP]: 1,
  [Directive.BZ]: 1,
  [Directive.CALL]: 2,
}

function numberValue(value: RuntimeValue) {
  return Number(value)
}

function popNumber() {
  return numberValue(Store.vs.pop())
}

function currentFrame() {
  const index = Store.cs.length - 1
  if (index < 0) return null
  return Store.cs[index]
}

function snapshotEnv() {
  const env = Object.fromEntries(Store.env)
  const frame = currentFrame()
  if (frame !== null) {
    for (const [key, value] of frame.locals) {
      env[key] = value
    }
  }
  return env
}

function snapshot(pc = Store.pc): VmSnapshot {
  return {
    pc,
    ax: Store.ax,
    vs: [...Store.vs],
    env: snapshotEnv(),
  }
}

function execute(text: DirectiveItem[], shouldTrace: boolean) {
  Store.pc = 0
  const trace: VmTraceStep[] = []

  let op
  while (true) {
    const pc = Store.pc
    const before = snapshot(pc)
    op = text[Store.pc++]

    if (op == null) break

    const operandCount = typeof op === 'string' ? directiveOperands[op as DirectiveName] ?? 0 : 0
    const operands = text.slice(Store.pc, Store.pc + operandCount)

    if (op === Directive.CONST) { Store.ax = text[Store.pc++] }
    else if (op === Directive.LOAD) {
      const name = String(text[Store.pc++])
      const frame = currentFrame()
      if (frame !== null && frame.locals.has(name)) {
        Store.ax = frame.locals.get(name)
      } else {
        Store.ax = Store.env.get(name)
      }
    }
    else if (op === Directive.STORE) {
      const name = String(text[Store.pc++])
      const frame = currentFrame()
      if (frame !== null) {
        frame.locals.set(name, Store.ax)
      } else {
        Store.env.set(name, Store.ax)
      }
    }
    else if (op === Directive.PUSH) { Store.vs.push(Store.ax) }
    else if (op === Directive.JMP) {
      Store.pc = Number(text[Store.pc])
    }
    else if (op === Directive.BZ) {
      const target = Number(text[Store.pc++])
      if (!Store.ax) Store.pc = target
    }
    else if (op === Directive.ADD) { Store.ax = popNumber() + numberValue(Store.ax) }
    else if (op === Directive.SUB) { Store.ax = popNumber() - numberValue(Store.ax) }
    else if (op === Directive.MUL) { Store.ax = popNumber() * numberValue(Store.ax) }
    else if (op === Directive.DIV) { Store.ax = popNumber() / numberValue(Store.ax) }
    else if (op === Directive.LT) { Store.ax = popNumber() < numberValue(Store.ax) ? 1 : 0 }
    else if (op === Directive.PRINT) { console.log(Store.ax) }
    else if (op === Directive.CALL) {
      // CALL stores two operands after the directive: function name and arg count.
      const name = String(text[Store.pc++])
      const argc = Number(text[Store.pc++])
      const fn = Store.fns.get(name) ?? error('RUNTIME', `unknown function ${name}`)

      // Args were pushed left-to-right, so pop them right-to-left into params.
      const locals = new Map<string, RuntimeValue>()
      for (let index = fn.params.length - 1; index >= 0; index -= 1) {
        const param = fn.params[index]
        const value = Store.vs.pop()
        locals.set(param, value)
      }

      // Drop any extra supplied args for now; arity checks can be added later.
      for (let index = 0; index < argc - fn.params.length; index += 1) {
        Store.vs.pop()
      }

      // Save the next instruction as ret, then jump into the function body.
      Store.cs.push({ ret: Store.pc, locals })
      Store.pc = fn.entry
    }
    else if (op === Directive.RET) {
      const frame = Store.cs.pop() ?? error('RUNTIME', 'RET without call frame')
      Store.pc = frame.ret
    }
    else if (op === Directive.EXIT) {
      if (shouldTrace) trace.push({ pc, op, operands, sourceLine: directiveLines.get(pc) ?? null, before, after: snapshot() })
      break
    }
    else {
      break
    }

    if (shouldTrace) trace.push({ pc, op, operands, sourceLine: directiveLines.get(pc) ?? null, before, after: snapshot() })
  }

  return trace
}

let directiveItems: DirectiveItem[] = []
let directiveLines = new Map<number, number>()

export const VM = {
  directives: () => Object.freeze(directiveItems),
  emit: (...items: DirectiveItem[]) => { directiveItems.push(...items) },
  emitAll: (items: DirectiveItem[]) => { directiveItems.push(...items) },
  execute: () => execute(directiveItems, false),
  patch: (index: number, value: DirectiveItem) => { directiveItems[index] = value },
  pop: () => directiveItems.pop(),
  position: () => directiveItems.length,
  mark: (line: number) => { directiveLines.set(directiveItems.length, line) },
  registerFn: (name: string, params: string[], entry: number) => {
    Store.fns.set(name, { entry, params })
  },
  reset: () => { directiveItems = []; directiveLines = new Map() },
  trace: () => execute(directiveItems, true),
}
