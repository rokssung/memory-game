import { useState } from 'react'
import type { ModuleProps, FormModuleConfig, ProcessContext } from '../../types'

export function FormModule({ config, context, onContextUpdate, availableTransitions, onTransition }: ModuleProps<FormModuleConfig>) {
  const [local, setLocal] = useState<ProcessContext>(() => {
    const init: ProcessContext = {}
    for (const field of config.fields) {
      init[field.key] = context[field.key] ?? field.default ?? (field.type === 'boolean' ? false : '')
    }
    return init
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const next: Record<string, string> = {}
    for (const field of config.fields) {
      if (field.required && !local[field.key] && local[field.key] !== 0) {
        next[field.key] = `${field.label}은(는) 필수입니다.`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(transitionId: string) {
    if (!validate()) return
    onContextUpdate(local)
    onTransition(transitionId)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>

      <div className="space-y-4">
        {config.fields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>

            {field.type === 'select' ? (
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={String(local[field.key] ?? '')}
                onChange={(e) => setLocal((p) => ({ ...p, [field.key]: e.target.value }))}
              >
                <option value="">선택하세요</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === 'text' ? (
              <textarea
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.placeholder}
                value={String(local[field.key] ?? '')}
                onChange={(e) => setLocal((p) => ({ ...p, [field.key]: e.target.value }))}
              />
            ) : field.type === 'boolean' ? (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600"
                  checked={Boolean(local[field.key])}
                  onChange={(e) => setLocal((p) => ({ ...p, [field.key]: e.target.checked }))}
                />
                <span className="text-sm text-gray-600">{field.placeholder ?? '예'}</span>
              </label>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.placeholder}
                value={String(local[field.key] ?? '')}
                onChange={(e) => setLocal((p) => ({ ...p, [field.key]: e.target.value }))}
              />
            )}

            {errors[field.key] && (
              <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        {availableTransitions.map((t) => (
          <button
            key={t.id}
            onClick={() => handleSubmit(t.id)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
