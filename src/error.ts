export function error(scope: string, message: string): never {
  throw new Error(`${scope} ERR: ${message}`)
}
