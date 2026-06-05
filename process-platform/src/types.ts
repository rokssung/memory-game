// ─── Field Definitions ────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number' | 'boolean' | 'text' | 'select' | 'date' | 'user'

export interface FieldDef {
  type: FieldType
  label: string
  required?: boolean
  options?: string[]        // for 'select' type
  default?: unknown
}

// ─── Module Configs ───────────────────────────────────────────────────────────

export interface FormFieldConfig {
  key: string               // maps to context variable name
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

export interface FormModuleConfig {
  title: string
  fields: FormFieldConfig[]
  submitLabel?: string
}

export interface ApprovalModuleConfig {
  title: string
  description?: string
  approveLabel?: string
  rejectLabel?: string
  commentKey?: string       // context key to write comment into
  resultKey: string         // context key to write true/false into
}

export interface NotificationModuleConfig {
  title: string
  messageTemplate: string   // "Hello {{assignee}}, task {{title}} is ready."
  autoAdvance: boolean      // if true, transition fires immediately after toast
}

export interface DocumentGenModuleConfig {
  title: string
  template: string          // text with {{contextKey}} interpolation
  outputKey: string         // context key to store generated document string
}

export interface DashboardModuleConfig {
  title: string
  groupByKey: string        // context key used to group cards (e.g. "status")
  cardTitleKey: string
  cardSubtitleKey?: string
  columns: { value: string; label: string }[]
}

export type ModuleConfig =
  | { type: 'form';         config: FormModuleConfig }
  | { type: 'approval';     config: ApprovalModuleConfig }
  | { type: 'notification'; config: NotificationModuleConfig }
  | { type: 'document-gen'; config: DocumentGenModuleConfig }
  | { type: 'dashboard';    config: DashboardModuleConfig }

// ─── Process Definition ───────────────────────────────────────────────────────

export interface ProcessState {
  id: string
  label: string
  module: ModuleConfig
  terminal?: boolean        // if true, no outgoing transitions expected
}

// json-logic-js rule — typed as unknown because the library uses any internally
export type JsonLogicRule = Record<string, unknown> | boolean | null

export interface ProcessTransition {
  id: string
  from: string
  to: string
  label: string
  trigger: 'manual' | 'auto'
  // json-logic rule evaluated against context; null = always allowed
  condition: JsonLogicRule
}

export interface ProcessDefinition {
  id: string
  name: string
  description: string
  version: string
  icon?: string             // emoji or short string for UI
  contextSchema: Record<string, FieldDef>
  initialState: string
  states: ProcessState[]
  transitions: ProcessTransition[]
}

// ─── Runtime Instance ─────────────────────────────────────────────────────────

export type ProcessContext = Record<string, unknown>

export interface HistoryEntry {
  stateId: string
  stateLabel: string
  enteredAt: string
  exitedAt?: string
  transitionId?: string
  transitionLabel?: string
  contextSnapshot: ProcessContext
}

export type InstanceStatus = 'active' | 'completed' | 'rejected'

export interface ProcessInstance {
  id: string
  definitionId: string
  definitionVersion: string  // pinned at creation time
  title: string              // human-readable label (derived from context or user input)
  currentState: string
  status: InstanceStatus
  context: ProcessContext
  history: HistoryEntry[]
  createdAt: string
  updatedAt: string
}

// ─── Module Runtime Props ─────────────────────────────────────────────────────
// Each module component receives these props from ProcessRenderer.

export interface ModuleProps<TConfig = Record<string, unknown>> {
  config: TConfig
  context: ProcessContext
  onContextUpdate: (patch: ProcessContext) => void
  // called by module when it considers itself "done" (triggers auto transitions)
  onComplete: () => void
  // available outgoing transitions so module can render action buttons
  availableTransitions: ProcessTransition[]
  onTransition: (transitionId: string) => void
  instanceId: string
  readOnly?: boolean
}

// ─── Notification (Toast) ─────────────────────────────────────────────────────

export type ToastLevel = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  level: ToastLevel
  message: string
}
