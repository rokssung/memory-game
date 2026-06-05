import type { ProcessDefinition, ProcessInstance } from '../types'

interface Props {
  definition: ProcessDefinition
  instance: ProcessInstance
}

export function StepNav({ definition, instance }: Props) {
  const currentIdx = definition.states.findIndex((s) => s.id === instance.currentState)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center gap-1 overflow-x-auto">
        {definition.states.map((state, idx) => {
          const isDone = idx < currentIdx
          const isCurrent = idx === currentIdx
          const isUpcoming = idx > currentIdx

          return (
            <div key={state.id} className="flex items-center gap-1 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span
                  className={`text-xs mt-1 max-w-16 text-center leading-tight ${
                    isCurrent ? 'text-blue-600 font-semibold' : isUpcoming ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {state.label}
                </span>
              </div>
              {idx < definition.states.length - 1 && (
                <div
                  className={`h-0.5 w-6 mt-[-14px] ${
                    idx < currentIdx ? 'bg-green-400' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>{instance.title}</span>
        <span
          className={`px-2 py-0.5 rounded-full font-medium ${
            instance.status === 'completed'
              ? 'bg-green-100 text-green-700'
              : instance.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {instance.status === 'completed' ? '완료' : instance.status === 'rejected' ? '반려' : '진행중'}
        </span>
      </div>
    </div>
  )
}
