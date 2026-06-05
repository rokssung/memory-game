import { useEffect, useRef } from 'react'
import type { ModuleProps, DocumentGenModuleConfig } from '../../types'
import { interpolate } from '../../engine/processEngine'

export function DocumentGenModule({ config, context, onContextUpdate, availableTransitions, onTransition }: ModuleProps<DocumentGenModuleConfig>) {
  const generated = interpolate(config.template, context)
  const saved = useRef(false)

  useEffect(() => {
    if (saved.current) return
    saved.current = true
    onContextUpdate({ [config.outputKey]: generated })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>

      <div className="bg-white border border-gray-200 rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed shadow-sm">
        {generated}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => {
            const blob = new Blob([generated], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${config.outputKey}.txt`
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          다운로드
        </button>
        {availableTransitions.map((t) => (
          <button
            key={t.id}
            onClick={() => onTransition(t.id)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
