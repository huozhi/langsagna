export type RuntimeValue = string | number | null | undefined

export type FnDef = {
  entry: number
  params: string[]
}

export type CallFrame = {
  ret: number
  locals: Map<string, RuntimeValue>
}

type StoreState = {
  ax: RuntimeValue
  pc: number
  vs: RuntimeValue[]
  env: Map<string, RuntimeValue>
  fns: Map<string, FnDef>
  cs: CallFrame[]
  reset: () => void
}

export const Store: StoreState = {
  ax: 0,          // accumulator
  pc: 0,          // program counter
  vs: [],         // value stack
  env: new Map(), // runtime environment: name -> value
  fns: new Map(), // function table: name -> entry/params
  cs: [],         // call stack
  reset() {
    this.ax = 0
    this.pc = 0
    this.vs = []
    this.env = new Map()
    this.fns = new Map()
    this.cs = []
  },
}
