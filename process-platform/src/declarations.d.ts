// Fallback declaration in case @types/json-logic-js is unavailable
declare module 'json-logic-js' {
  function apply(rule: unknown, data?: unknown): unknown
  export default { apply }
}
