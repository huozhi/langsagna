export class LangError extends Error {
  pc: number | null = null

  constructor(
    public scope: string,
    public detail: string,
    public sourceLine: number | null = null,
  ) {
    super(`${scope} ERR: ${detail}`)
    this.name = 'LangError'
  }
}

export function error(scope: string, message: string, sourceLine: number | null = null): never {
  throw new LangError(scope, message, sourceLine)
}
