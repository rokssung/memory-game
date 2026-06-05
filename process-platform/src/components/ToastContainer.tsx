import { useNotificationStore } from '../store/notificationStore'

const levelStyle: Record<string, string> = {
  info: 'bg-blue-600',
  success: 'bg-green-600',
  warning: 'bg-yellow-500',
  error: 'bg-red-600',
}

export function ToastContainer() {
  const { toasts, dismiss } = useNotificationStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${levelStyle[t.level] ?? 'bg-gray-700'} text-white px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 pointer-events-auto max-w-sm animate-fade-in`}
        >
          <span className="text-sm flex-1">{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            className="text-white/70 hover:text-white text-lg leading-none mt-[-1px]"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
