import type { ProcessDefinition, ProcessInstance } from '../types'
import { getAvailableTransitions, getState } from '../engine/processEngine'
import { resolveModule } from '../engine/moduleRegistry'
import { useProcessStore } from '../store/processStore'
import { useNotificationStore } from '../store/notificationStore'
import { StepNav } from './StepNav'

interface Props {
  definition: ProcessDefinition
  instance: ProcessInstance
}

export function ProcessRenderer({ definition, instance }: Props) {
  const { updateContext, transition } = useProcessStore()
  const pushToast = useNotificationStore((s) => s.push)

  const currentStateDef = getState(definition, instance.currentState)
  if (!currentStateDef) {
    return <div className="text-red-500">알 수 없는 상태: {instance.currentState}</div>
  }

  const availableTransitions = getAvailableTransitions(definition, instance.currentState, instance.context)

  function handleTransition(transitionId: string) {
    const t = definition.transitions.find((tr) => tr.id === transitionId)
    if (!t) return
    const nextState = getState(definition, t.to)
    if (!nextState) return

    const isFinal = Boolean(nextState.terminal)
    const status = isFinal
      ? t.label.includes('반려') || t.label.includes('reject') ? 'rejected' as const : 'completed' as const
      : 'active' as const

    transition(instance.id, t.id, t.label, t.to, nextState.label, isFinal, status)
    pushToast(`${t.label} → ${nextState.label}`, 'success')
  }

  function handleContextUpdate(patch: Record<string, unknown>) {
    updateContext(instance.id, patch)
  }

  const ModuleComponent = resolveModule(currentStateDef.module)

  return (
    <div className="flex flex-col gap-6">
      <StepNav definition={definition} instance={instance} />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <ModuleComponent
          config={currentStateDef.module.config as Record<string, unknown>}
          context={instance.context}
          onContextUpdate={handleContextUpdate}
          onComplete={() => {
            const auto = availableTransitions.find((t) => t.trigger === 'auto')
            if (auto) handleTransition(auto.id)
          }}
          availableTransitions={availableTransitions}
          onTransition={handleTransition}
          instanceId={instance.id}
        />
      </div>
    </div>
  )
}
