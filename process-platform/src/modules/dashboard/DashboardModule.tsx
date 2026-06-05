import { useNavigate } from 'react-router-dom'
import type { ModuleProps, DashboardModuleConfig } from '../../types'
import { useProcessStore } from '../../store/processStore'

export function DashboardModule({ config, instanceId }: ModuleProps<DashboardModuleConfig>) {
  const navigate = useNavigate()
  const allInstances = useProcessStore((s) => s.instances)

  // Dashboard shows all instances for the same process definition
  const currentInst = allInstances.find((i) => i.id === instanceId)
  const peers = allInstances.filter(
    (i) => i.definitionId === currentInst?.definitionId,
  )

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {config.columns.map((col) => {
          const cards = peers.filter((inst) => {
            const val = inst.context[config.groupByKey]
            // match by current state id or by context value
            return val === col.value || inst.currentState === col.value
          })
          return (
            <div key={col.value} className="flex-shrink-0 w-64">
              <div className="bg-gray-100 rounded-t-lg px-3 py-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{col.label}</span>
                <span className="text-xs bg-gray-300 text-gray-700 rounded-full px-2 py-0.5">{cards.length}</span>
              </div>
              <div className="bg-gray-50 rounded-b-lg min-h-32 p-2 space-y-2">
                {cards.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => navigate(`/process/${inst.definitionId}/${inst.id}`)}
                    className={`w-full text-left bg-white border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow ${
                      inst.id === instanceId ? 'border-blue-400 ring-1 ring-blue-300' : 'border-gray-200'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {String(inst.context[config.cardTitleKey] ?? inst.title)}
                    </p>
                    {config.cardSubtitleKey && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {String(inst.context[config.cardSubtitleKey] ?? '')}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{inst.currentState}</p>
                  </button>
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-gray-400 p-2 text-center">항목 없음</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
