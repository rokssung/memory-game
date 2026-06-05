import jsonLogic from 'json-logic-js'
import type { ProcessDefinition, ProcessTransition, ProcessContext, JsonLogicRule } from '../types'

export function evaluateCondition(rule: JsonLogicRule, context: ProcessContext): boolean {
  if (rule === null || rule === true) return true
  if (rule === false) return false
  try {
    return Boolean(jsonLogic.apply(rule as Parameters<typeof jsonLogic.apply>[0], context))
  } catch {
    return false
  }
}

export function getAvailableTransitions(
  definition: ProcessDefinition,
  currentStateId: string,
  context: ProcessContext,
): ProcessTransition[] {
  return definition.transitions.filter(
    (t) => t.from === currentStateId && evaluateCondition(t.condition, context),
  )
}

export function getState(definition: ProcessDefinition, stateId: string) {
  return definition.states.find((s) => s.id === stateId)
}

export function interpolate(template: string, context: ProcessContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = context[key]
    return val !== undefined && val !== null ? String(val) : ''
  })
}

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}
