import fs from 'node:fs'
import path from 'node:path'
import { parse } from '../src/compiler/parse.ts'
import { renderTrace, renderTraceFrame } from '../src/debug/trace.ts'
import { LangError } from '../src/error.ts'
import { resetRuntime } from '../src/runtime/runtime.ts'
import { VM } from '../src/runtime/vm.ts'

const defaultExamples = [
  'examples/assignment',
  'examples/loop',
  'examples/if-else',
  'examples/function-call',
  'examples/print-flow',
]

const args = process.argv.slice(2)
const traceMode = args.includes('--trace') || args.includes('-t')
const stepMode = args.includes('--step') || args.includes('-s')
const flags = new Set(['--trace', '-t', '--step', '-s'])
const files = args.filter(arg => !flags.has(arg))
const targets = files.length > 0 ? files : defaultExamples

function readSource(target: string) {
  const filename = path.resolve(process.cwd(), target)
  return fs.readFileSync(filename, 'utf8')
}

function compileFixture(target: string) {
  const source = readSource(target)

  resetRuntime(source)
  parse()

  return {
    directives: VM.directives(),
    source,
    target,
  }
}

function formatError(target: string, source: string, err: unknown) {
  if (!(err instanceof LangError)) throw err

  const lines = source.split('\n')
  if (err.sourceLine === null) return `${target}\n${err.message}`

  const line = lines[err.sourceLine - 1] ?? ''
  const column = line.search(/\S/)
  const caret = column < 0 ? '^' : `${' '.repeat(column)}^`

  return [
    `${target}:${err.sourceLine}`,
    `${err.sourceLine} | ${line}`,
    `${' '.repeat(String(err.sourceLine).length)} | ${caret}`,
    err.message,
  ].join('\n')
}

function clearScreen() {
  process.stdout.write('\x1Bc')
}

async function waitForKey() {
  return new Promise<'next' | 'previous' | 'quit'>(resolve => {
    const onData = (data: Buffer) => {
      const key = data.toString()
      process.stdin.off('data', onData)

      if (key === 'q' || key === '\u0003') resolve('quit')
      else if (key === 'p') resolve('previous')
      else resolve('next')
    }

    process.stdin.once('data', onData)
  })
}

function execFixture(target: string) {
  const source = readSource(target)
  try {
    compileFixture(target)
    VM.execute()
  } catch (err) {
    console.error(formatError(target, source, err))
    process.exitCode = 1
  }
}

function renderTraceFor(target: string, index: number) {
  const source = readSource(target)
  try {
    const { directives } = compileFixture(target)
    const trace = VM.trace()

    if (index > 0) console.log('\n')
    console.log(renderTrace(target, source, directives, trace))
  } catch (err) {
    if (index > 0) console.log('\n')
    console.error(formatError(target, source, err))
    process.exitCode = 1
  }
}

async function renderInteractive(target: string) {
  const source = readSource(target)
  let compiled: ReturnType<typeof compileFixture>
  let trace: ReturnType<typeof VM.trace>

  try {
    compiled = compileFixture(target)
    trace = VM.trace()
  } catch (err) {
    console.error(formatError(target, source, err))
    process.exitCode = 1
    return
  }

  let step = 0

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true)
  }
  process.stdin.resume()

  while (true) {
    clearScreen()
    console.log(renderTraceFrame(target, source, compiled.directives, trace, step))

    const action = await waitForKey()
    if (action === 'quit') break
    if (action === 'previous') step = Math.max(0, step - 1)
    else if (step >= trace.length - 1) break
    else step += 1
  }

  if (process.stdin.isTTY) {
    process.stdin.setRawMode(false)
  }
  process.stdin.pause()
}

if (stepMode) {
  await renderInteractive(targets[0])
} else if (traceMode) {
  for (const [index, target] of targets.entries()) {
    renderTraceFor(target, index)
  }
} else {
  for (const target of targets) {
    execFixture(target)
  }
}
