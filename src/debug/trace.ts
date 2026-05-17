import type { DirectiveItem, VmTraceStep } from '../runtime/vm.ts'
import type { RuntimeValue } from '../runtime/storage.ts'

function valueText(value: RuntimeValue) {
  if (value === undefined) return 'undefined'
  return JSON.stringify(value)
}

function stackText(values: RuntimeValue[]) {
  if (values.length === 0) return '[]'
  return `[${values.map(valueText).join(', ')}]`
}

function envText(env: Record<string, RuntimeValue>) {
  const entries = Object.entries(env)
  if (entries.length === 0) return '{}'
  return `{ ${entries.map(([key, value]) => `${key}: ${valueText(value)}`).join(', ')} }`
}

function directiveText(step: VmTraceStep) {
  return [step.op, ...step.operands].map(String).join(' ')
}

function renderDirectives(directives: readonly DirectiveItem[], activePc: number | null) {
  const lines: string[] = []

  for (let i = 0; i < directives.length; i++) {
    const pc = i
    const op = directives[i]
    const marker = pc === activePc ? '->' : '  '

    if (op === 'CONST' || op === 'LOAD' || op === 'STORE' || op === 'JMP' || op === 'BZ' || op === 'CALL' || op === 'PRINT') {
      lines.push(`${marker} ${String(pc).padStart(2, '0')}: ${op} ${directives[++i]}`)
    } else {
      lines.push(`${marker} ${String(pc).padStart(2, '0')}: ${op}`)
    }
  }

  return lines
}

export function renderTrace(programName: string, source: string, directives: readonly DirectiveItem[], trace: VmTraceStep[]) {
  const lines: string[] = []

  lines.push(`+${'-'.repeat(70)}+`)
  lines.push(`| trace: ${programName.padEnd(62)} |`)
  lines.push(`+${'-'.repeat(70)}+`)
  lines.push('')
  lines.push('source')
  lines.push('------')
  lines.push(source.trimEnd().split('\n').map(line => `  ${line}`).join('\n'))
  lines.push('')
  lines.push('directives')
  lines.push('----------')
  lines.push(...renderDirectives(directives, null))

  lines.push('')
  lines.push('execution')
  lines.push('---------')

  for (const [index, step] of trace.entries()) {
    lines.push(`step ${String(index + 1).padStart(2, '0')} | pc ${String(step.pc).padStart(2, '0')} | ${directiveText(step)}`)
    lines.push(`  before  ax=${valueText(step.before.ax).padEnd(9)} vs=${stackText(step.before.vs).padEnd(12)} env=${envText(step.before.env)}`)
    lines.push(`  after   ax=${valueText(step.after.ax).padEnd(9)} vs=${stackText(step.after.vs).padEnd(12)} env=${envText(step.after.env)}`)
    lines.push('')
  }

  const last = trace.at(-1)?.after
  if (last) {
    lines.push('result')
    lines.push('------')
    lines.push(`  ax  = ${valueText(last.ax)}`)
    lines.push(`  vs  = ${stackText(last.vs)}`)
    lines.push(`  env = ${envText(last.env)}`)
  }

  return lines.join('\n')
}

export function renderTraceFrame(
  programName: string,
  source: string,
  directives: readonly DirectiveItem[],
  trace: VmTraceStep[],
  stepIndex: number,
) {
  const step = trace[stepIndex]
  const lines: string[] = []

  lines.push(`+${'-'.repeat(70)}+`)
  lines.push(`| trace: ${programName.padEnd(62)} |`)
  lines.push(`+${'-'.repeat(70)}+`)
  lines.push(`step ${stepIndex + 1}/${trace.length} | pc ${String(step.pc).padStart(2, '0')} | ${directiveText(step)}`)
  lines.push('')
  lines.push('source')
  lines.push('------')
  lines.push(source.trimEnd().split('\n').map(line => `  ${line}`).join('\n'))
  lines.push('')
  lines.push('directives')
  lines.push('----------')
  lines.push(...renderDirectives(directives, step.pc))
  lines.push('')
  lines.push('state change')
  lines.push('------------')
  lines.push(`  before  ax=${valueText(step.before.ax).padEnd(9)} vs=${stackText(step.before.vs).padEnd(12)} env=${envText(step.before.env)}`)
  lines.push(`  after   ax=${valueText(step.after.ax).padEnd(9)} vs=${stackText(step.after.vs).padEnd(12)} env=${envText(step.after.env)}`)
  lines.push('')
  lines.push('keys: Enter/n = next, p = previous, q = quit')

  return lines.join('\n')
}
