import { useNavigate } from 'react-router-dom'
import type { ProcessDefinition, ProcessInstance } from '../types'
import { generateId } from '../engine/processEngine'
import { useProcessStore } from '../store/processStore'

interface Props {
  definitions: ProcessDefinition[]
}

export function ProcessSelector({ definitions }: Props) {
  const navigate = useNavigate()
  const { createInstance, instances } = useProcessStore()

  function handleCreate(def: ProcessDefinition) {
    const now = new Date().toISOString()
    const instance: ProcessInstance = {
      id: generateId(),
      definitionId: def.id,
      definitionVersion: def.version,
      title: `${def.name} #${instances.filter((i) => i.definitionId === def.id).length + 1}`,
      currentState: def.initialState,
      status: 'active',
      context: {},
      history: [
        {
          stateId: def.initialState,
          stateLabel: def.states.find((s) => s.id === def.initialState)?.label ?? def.initialState,
          enteredAt: now,
          contextSnapshot: {},
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
    createInstance(instance)
    navigate(`/process/${def.id}/${instance.id}`)
  }

  const activeInstances = instances.filter((i) => i.status === 'active')
  const recentInstances = [...instances].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10)

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Process Platform</h1>
        <p className="text-gray-500 mt-1">JSON 설정으로 정의된 업무 프로세스를 실행하는 메타 시스템</p>
      </div>

      {/* Process Definitions */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">프로세스 시작</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {definitions.map((def) => {
            const count = instances.filter((i) => i.definitionId === def.id).length
            return (
              <div key={def.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{def.icon}</span>
                      <h3 className="text-base font-semibold text-gray-900">{def.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{def.description}</p>
                    <p className="text-xs text-gray-400 mt-2">v{def.version} · 인스턴스 {count}개</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCreate(def)}
                  className="mt-4 w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  새 인스턴스 시작
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Active Instances */}
      {activeInstances.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">진행중 ({activeInstances.length})</h2>
          <InstanceList instances={activeInstances} definitions={definitions} />
        </section>
      )}

      {/* Recent */}
      {recentInstances.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-700 mb-4">최근 인스턴스</h2>
          <InstanceList instances={recentInstances} definitions={definitions} />
        </section>
      )}
    </div>
  )
}

function InstanceList({ instances, definitions }: { instances: ProcessInstance[]; definitions: ProcessDefinition[] }) {
  const navigate = useNavigate()
  const { deleteInstance } = useProcessStore()

  return (
    <div className="space-y-2">
      {instances.map((inst) => {
        const def = definitions.find((d) => d.id === inst.definitionId)
        const currentState = def?.states.find((s) => s.id === inst.currentState)
        return (
          <div
            key={inst.id}
            className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            onClick={() => navigate(`/process/${inst.definitionId}/${inst.id}`)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{def?.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{inst.title}</p>
                <p className="text-xs text-gray-400">{def?.name} · {currentState?.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  inst.status === 'completed' ? 'bg-green-100 text-green-700'
                  : inst.status === 'rejected' ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700'
                }`}
              >
                {inst.status === 'completed' ? '완료' : inst.status === 'rejected' ? '반려' : '진행중'}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); deleteInstance(inst.id) }}
                className="text-gray-300 hover:text-red-400 text-lg leading-none"
              >
                ×
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
