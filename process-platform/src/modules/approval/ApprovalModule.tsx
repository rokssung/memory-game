import { useState } from 'react'
import type { ModuleProps, ApprovalModuleConfig } from '../../types'

export function ApprovalModule({ config, context, onContextUpdate, availableTransitions, onTransition }: ModuleProps<ApprovalModuleConfig>) {
  const [comment, setComment] = useState(
    config.commentKey ? String(context[config.commentKey] ?? '') : '',
  )

  function decide(approved: boolean, transitionId: string) {
    const patch = { [config.resultKey]: approved } as Record<string, unknown>
    if (config.commentKey) patch[config.commentKey] = comment
    onContextUpdate(patch)
    onTransition(transitionId)
  }

  // Separate approve vs reject transitions by convention: first transition = approve path
  // The condition on each transition handles routing, but we label buttons by transition label.
  const approveT = availableTransitions.find((t) =>
    t.label.includes('승인') || t.label.toLowerCase().includes('approv') || t.label.includes('완료'),
  ) ?? availableTransitions[0]
  const rejectT = availableTransitions.find((t) =>
    t.label.includes('반려') || t.label.toLowerCase().includes('reject') || t.label.includes('수정'),
  ) ?? availableTransitions[1]

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">{config.title}</h2>

      {config.description && (
        <p className="text-sm text-gray-500">{config.description}</p>
      )}

      {/* Show current context summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
        {Object.entries(context).map(([k, v]) =>
          v !== undefined && v !== '' ? (
            <div key={k} className="flex gap-2">
              <span className="text-gray-500 min-w-24">{k}</span>
              <span className="text-gray-800 font-medium">{String(v)}</span>
            </div>
          ) : null,
        )}
      </div>

      {config.commentKey !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">코멘트</label>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="검토 의견을 입력하세요 (선택)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
      )}

      <div className="flex gap-3 pt-2">
        {approveT && (
          <button
            onClick={() => decide(true, approveT.id)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            {config.approveLabel ?? approveT.label}
          </button>
        )}
        {rejectT && (
          <button
            onClick={() => decide(false, rejectT.id)}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
          >
            {config.rejectLabel ?? rejectT.label}
          </button>
        )}
      </div>
    </div>
  )
}
