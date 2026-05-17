# lang 
> Practice for interpretation of simple handmade language

## About

Thanks for cool practice of [c4](https://github.com/rswier/c4) and awesome explaination in [write a C interpreter](https://github.com/lotabout/write-a-C-interpreter). Still work in progress.

## Play

Run the Bun test suite:

```
bun run test
```

Run the default examples:

```
bun run exec
```

Run one example:

```
bun run exec examples/assignment
```

Show directive traces:

```
bun run exec -- --trace examples/assignment
```

Step through execution interactively:

```
bun run exec -- --step examples/loop
```

Use Enter or `n` for next, `p` for previous, and `q` to quit.

## Examples

Programs live in `examples/`.

| Example | Command | What it shows |
| --- | --- | --- |
| `assignment` | `bun run exec examples/assignment` | variables and arithmetic |
| `loop` | `bun run exec examples/loop` | `while` loops |
| `if-else` | `bun run exec examples/if-else` | `if` / `else` branches |
| `function-call` | `bun run exec examples/function-call` | nested function calls and `print` |
| `print-flow` | `bun run exec examples/print-flow` | `print()` system call |
| `load-file` | `bun run exec examples/load-file` | `load(path)` reads a file and prints it |
| `expression` | `bun run exec examples/expression` | operator precedence |
| `complex-expression` | `bun run exec examples/complex-expression` | grouped expressions |
| `weighted-loop` | `bun run exec examples/weighted-loop` | loop with multiplication |
| `assertions` | `bun run exec examples/assertions` | `assert(expr)`; fails on the last check |

Trace a specific example:

```
bun run exec -- --trace examples/function-call
```

## API

Use the package entry API:

```ts
import { execute } from './src/index.ts'

console.log(execute('a = 1; b = a + 2; b;')) // 3
```

Runtime/compiler code lives in `src/`, grouped by pipeline stage:
`lexer/`, `compiler/`, `runtime/`, and `debug/`.
Tests and test helpers live in `test/`.

## Plan

See [docs/design.md](docs/design.md) for the current gaps between this project and the c4-inspired language target.
