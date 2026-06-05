import { useEffect, useRef } from 'react'
import type { ModuleProps, NotificationModuleConfig } from '../../types'
import { interpolate } from '../../engine/processEngine'
import { useNotificationStore } from '../../store/notificationStore'

export function NotificationModule({ config, context, availableTransitions, onTransition, onComplete }: ModuleProps<NotificationModuleConfig>) {
  const push = useNotificationStore((s) => s.push)
  const fired = useRef(false)

  const message = interpolate(config.messageTemplate, context)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    push(message, 'info')
    if (config.autoAdvance) {
      const t = availableTransitions[0]
      if (t) setTimeout(() => onTransition(t.id), 800)
      else onComplete()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        {message}
      </div>
      {!config.autoAdvance && (
        <div className="flex gap-3">
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
      )}
    </div>
  )
}
