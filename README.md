# lang 
> Practice for interpretation of simple handmade language

## About

Thanks for cool practice of [c4](https://github.com/rswier/c4) and awesome explaination in [write a C interpreter](https://github.com/lotabout/write-a-C-interpreter). Still work in progress.

## Play

```sh
bun run test
bun run exec examples/assignment
bun run exec -- --trace examples/loop
bun run exec -- --step examples/if-else
```

Programs live in `examples/`. Use Enter or `n` for next, `p` for previous, and `q` to quit in step mode.

## Language

### Syntax

- numbers: `1`, `42`
- strings: `"hello"`, `'path/to/file'`
- variables: `a`, `count_1`
- assignment: `a = 1 + 2`
- arithmetic: `+`, `-`, `*`, `/` (numeric only)
- comparison: `<` (returns `1` or `0`)
- parentheses: `(1 + 2) * 3`
- blocks: `{ ... }`
- `if (expr) { ... } else { ... }`
- `while (expr) { ... }`
- `fn name(a, b) { ... }`
- `return expr;`
- function calls: `add(1, 2)`
- statements end with `;`
- last expression value is the program result

Not supported yet: string `+`, `==`, arrays, comments, forward references.

### System calls

| Call | Args | Result |
| --- | --- | --- |
| `print(...)` | zero or more expressions | prints to stdout, leaves last arg in `ax` |
| `assert(expr)` | one expression | throws if falsy |
| `clock()` | none | `Date.now()` |
| `load(path)` | path expression (string) | file contents as string |

Functions must be declared before use. Calls check arity (`add(1)` is an error).

## Examples

<details>
<summary>Assignment and arithmetic</summary>

```js
a = 1;
b = 2 + a;
b;
```

```
→ 3
```

</details>

<details>
<summary>Loop</summary>

```js
i = 0;
sum = 0;
while (i < 2) {
  sum = sum + i;
  i = i + 1;
}
sum;
```

```
→ 1
```

</details>

<details>
<summary>If / else and multi-arg print</summary>

```js
value = 0;
if (value) {
  result = 1;
} else {
  result = 2;
}
print('result =', result);
result;
```

```
→ prints: result = 2
→ returns: 2
```

</details>

<details>
<summary>Functions</summary>

```js
fn add(a, b) {
  return a + b;
}
add(1, 2);
```

```
→ 3
```

</details>

<details>
<summary>Load a file</summary>

```js
load("examples/assignment");
```

```
→ a = 1;
b = 2 + a;
```

</details>

<details>
<summary>Failed assertion</summary>

```js
assert(1);
assert(1 + 2 < 4);
assert(2 + 2 < 4);
```

```
→ RUNTIME ERR: assert failed
   at line 3
```

</details>

## API

```ts
import { execute } from './src/index.ts'

execute('a = 1; b = a + 2; b;') // 3
```

`execute(code)` compiles and runs source, then returns the final value in `ax`.

For directive-level debugging:

```ts
import { inspect } from './src/index.ts'

const { directives, trace, result } = inspect('a = 1; a;')
```

Runtime code is under `src/` (`lexer/`, `compiler/`, `runtime/`, `debug/`). Tests are in `test/`.

## Plan

See [docs/design.md](docs/design.md) for the current gaps between this project and the c4-inspired language target.
