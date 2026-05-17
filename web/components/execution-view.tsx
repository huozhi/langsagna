'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  inspect,
  type DirectiveItem,
  type InspectResult,
  type RuntimeValue,
  type VmTraceStep,
} from '../../src/index'

type Program = {
  name: string
  code: string
}

const programs: Program[] = [
  {
    name: 'weighted loop',
    code: `i = 0;
sum = 0;
while (i < 4) {
  sum = sum + i * 2;
  i = i + 1;
}
sum + i;`,
  },
  {
    name: 'print flow',
    code: `a = 1 + 2 * 3;
print(a);
b = a + 4;
b;`,
  },
  {
    name: 'complex expression',
    code: `base = 2 * (3 + 4);
offset = (base - 5) * (1 + 2);
offset + base;`,
  },
  {
    name: 'function call',
    code: `fn add(a, b) {
  return a + b;
}

fn double(value) {
  return add(value, value);
}

fn mix(x, y, z) {
  return add(double(x), add(y, z));
}

result = mix(2, 3, 4);
print(result);
result;`,
  },
]

function valueText(value: RuntimeValue) {
  if (value === undefined) return 'undefined'
  return JSON.stringify(value)
}

type StateField = {
  name: string
  alias: string
  format: (snapshot: VmTraceStep['before']) => string
}

const stateFields: StateField[] = [
  { name: 'accumulator', alias: 'ax', format: snapshot => valueText(snapshot.ax) },
  { name: 'value stack', alias: 'vs', format: snapshot => stackCellText(snapshot.vs) },
  { name: 'environment', alias: 'env', format: snapshot => envCellText(snapshot.env) },
]

function envCellText(env: Record<string, RuntimeValue>) {
  const entries = Object.entries(env)
  if (entries.length === 0) return '{}'
  return entries.map(([key, value]) => `${key}: ${valueText(value)}`).join('\n')
}

function stackCellText(values: RuntimeValue[]) {
  if (values.length === 0) return '[]'
  return values.map((value, index) => `[${index}] ${valueText(value)}`).join('\n')
}

function directiveText(step: VmTraceStep) {
  return [step.op, ...step.operands].map(String).join(' ')
}

function directiveHasOperand(item: DirectiveItem) {
  return item === 'CONST' || item === 'LOAD' || item === 'STORE' || item === 'JMP' || item === 'BZ' || item === 'CALL'
}

type SourceRow = {
  line: string
  number: number
}

type DirectiveRow = {
  pc: number
  text: string
}

const sourceLineCount = 5

function sourceWindow(code: string, activeLine: number | null): SourceRow[] {
  const lines = code.split('\n')
  if (activeLine === null) {
    return lines.slice(0, sourceLineCount).map((line, index) => ({ line, number: index + 1 }))
  }

  const start = Math.max(1, Math.min(activeLine - 2, lines.length - sourceLineCount + 1))
  return lines.slice(start - 1, start - 1 + sourceLineCount).map((line, index) => ({
    line,
    number: start + index,
  }))
}

function directiveWindow(directives: readonly DirectiveItem[], activePc: number): DirectiveRow[] {
  const rows: DirectiveRow[] = []

  for (let index = 0; index < directives.length; index += 1) {
    const pc = index
    const item = directives[index]
    if (directiveHasOperand(item)) {
      index += 1
      rows.push({ pc, text: `${String(item)} ${String(directives[index])}` })
    } else {
      rows.push({ pc, text: String(item) })
    }
  }

  const activeIndex = Math.max(0, rows.findIndex(row => row.pc === activePc))
  const start = Math.max(0, Math.min(activeIndex - 2, rows.length - 6))
  return rows.slice(start, start + 6)
}

function isFormTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement
}

function previousProgramIndex(index: number) {
  return (index + programs.length - 1) % programs.length
}

function nextProgramIndex(index: number) {
  return (index + 1) % programs.length
}

function ProgramSwitcher({
  activeProgram,
  setActiveProgram,
  setActiveStep,
}: {
  activeProgram: number
  setActiveProgram: (value: number) => void
  setActiveStep: (value: number) => void
}) {
  const program = programs[activeProgram]

  return (
    <nav className="program-switcher" aria-label="program">
      <span className="program-switcher-label">Program</span>
      <button
        type="button"
        className="program-switcher-btn"
        aria-label="Previous program"
        onClick={() => {
          setActiveProgram(previousProgramIndex(activeProgram))
          setActiveStep(0)
        }}
      >
        [&lt;]
      </button>
      <span className="program-switcher-name">{program.name}</span>
      <button
        type="button"
        className="program-switcher-btn"
        aria-label="Next program"
        onClick={() => {
          setActiveProgram(nextProgramIndex(activeProgram))
          setActiveStep(0)
        }}
      >
        [&gt;]
      </button>
    </nav>
  )
}

function OpsBoard({
  activeStep,
  stepCount,
  step,
  result,
  setActiveStep,
}: {
  activeStep: number
  stepCount: number
  step: VmTraceStep
  result: InspectResult
  setActiveStep: (value: number) => void
}) {
  return (
    <section className="ops-board">
      <div className="ops-toolbar">
        <div className="meta step-meta">
          pc {step.pc} · {directiveText(step)} · result {valueText(result.result)}
        </div>
        <StepTransport
          activeStep={activeStep}
          stepCount={stepCount}
          setActiveStep={setActiveStep}
        />
      </div>
      <p className="hotkeys">
        <kbd>←</kbd> <kbd>→</kbd> step · <kbd>[</kbd> <kbd>]</kbd> program · <kbd>1</kbd>–<kbd>3</kbd> pick · <kbd>r</kbd> restart
      </p>
    </section>
  )
}

function StepTransport({
  activeStep,
  stepCount,
  setActiveStep,
}: {
  activeStep: number
  stepCount: number
  setActiveStep: (value: number) => void
}) {
  const atStart = activeStep === 0
  const atEnd = activeStep >= stepCount - 1

  return (
    <div className="step-transport-wrap">
      <div className="step-transport" aria-label="execution steps">
        <button
          type="button"
          className="transport-btn"
          disabled={atStart}
          aria-label="Previous step"
          onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
        >
          ‹
        </button>
        <span className="transport-count" aria-live="polite">
          {activeStep + 1}<span className="transport-total"> / {stepCount}</span>
        </span>
        <button
          type="button"
          className="transport-btn"
          disabled={atEnd}
          aria-label="Next step"
          onClick={() => setActiveStep(Math.min(stepCount - 1, activeStep + 1))}
        >
          ›
        </button>
      </div>
      <button
        type="button"
        className="transport-restart"
        disabled={atStart}
        aria-label="Restart from first step"
        onClick={() => setActiveStep(0)}
      >
        restart
      </button>
    </div>
  )
}

function SourcePanel({ code, step }: { code: string, step: VmTraceStep }) {
  const lines = sourceWindow(code, step.sourceLine)
  return (
    <section className="panel panel-col panel-code">
      <h2>code</h2>
      <ol className="source-list">
        {lines.map(row => (
          <li key={row.number} className={row.number === step.sourceLine ? 'active' : ''}>
            <span>{String(row.number).padStart(2, '0')}</span>
            <code>{row.line}</code>
          </li>
        ))}
      </ol>
    </section>
  )
}

function DirectivePanel({ result, step }: { result: InspectResult, step: VmTraceStep }) {
  const rows = directiveWindow(result.directives, step.pc)
  return (
    <section className="panel panel-col panel-directives">
      <h2>directives</h2>
      <ol className="directive-list">
        {rows.map(row => (
          <li key={row.pc} className={row.pc === step.pc ? 'active' : ''}>
            <span>{String(row.pc).padStart(2, '0')}</span>
            <code>{row.text}</code>
          </li>
        ))}
      </ol>
    </section>
  )
}

function StatePanel({ step }: { step: VmTraceStep }) {
  return (
    <section className="panel state-panel">
      <h2>state</h2>
      <table className="state-table">
        <colgroup>
          <col className="state-col-label" />
          <col className="state-col-value" />
          <col className="state-col-value" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col" />
            <th scope="col">before</th>
            <th scope="col">after</th>
          </tr>
        </thead>
        <tbody>
          {stateFields.map(field => (
            <tr key={field.alias} className={`state-row state-row-${field.alias}`}>
              <th scope="row">
                <span className="state-field-name">{field.name}</span>
                <span className="state-field-alias"> ({field.alias})</span>
              </th>
              <td><code>{field.format(step.before)}</code></td>
              <td><code>{field.format(step.after)}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function TokenPanel({ result }: { result: InspectResult }) {
  return (
    <section className="panel panel-tokens">
      <h2>tokens</h2>
      <ol className="token-list">
        {result.tokens.map((token, index) => (
          <li key={`${token.line}-${token.label}-${index}`}>
            <span>{token.line}</span>
            <code>{token.label}</code>
            {token.value !== null ? <small>{String(token.value)}</small> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function ExecutionView() {
  const [activeProgram, setActiveProgram] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const program = programs[activeProgram]
  const result = useMemo(() => inspect(program.code), [program.code])
  const step = result.trace[activeStep] ?? result.trace[0]

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (isFormTarget(event.target)) return

      if (event.key === 'ArrowLeft' || event.key === 'h') {
        event.preventDefault()
        setActiveStep(current => Math.max(0, current - 1))
        return
      }

      if (event.key === 'ArrowRight' || event.key === 'l' || event.key === ' ') {
        event.preventDefault()
        setActiveStep(current => Math.min(result.trace.length - 1, current + 1))
        return
      }

      if (event.key === 'Home' || event.key.toLowerCase() === 'r') {
        event.preventDefault()
        setActiveStep(0)
        return
      }

      if (event.key === '[' || event.key === 'j') {
        event.preventDefault()
        setActiveProgram(current => previousProgramIndex(current))
        setActiveStep(0)
        return
      }

      if (event.key === ']' || event.key === 'k') {
        event.preventDefault()
        setActiveProgram(current => nextProgramIndex(current))
        setActiveStep(0)
        return
      }

      const programIndex = Number(event.key) - 1
      if (Number.isInteger(programIndex) && programIndex >= 0 && programIndex < programs.length) {
        event.preventDefault()
        setActiveProgram(programIndex)
        setActiveStep(0)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [result.trace.length])

  return (
    <>
      <ProgramSwitcher
        activeProgram={activeProgram}
        setActiveProgram={setActiveProgram}
        setActiveStep={setActiveStep}
      />
      <section className="code-directives-grid">
        <SourcePanel code={program.code} step={step} />
        <DirectivePanel result={result} step={step} />
      </section>
      <OpsBoard
        activeStep={activeStep}
        stepCount={result.trace.length}
        step={step}
        result={result}
        setActiveStep={setActiveStep}
      />
      <StatePanel step={step} />
      <TokenPanel result={result} />
    </>
  )
}
