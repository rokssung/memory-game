import { BrowserRouter, Routes, Route, useParams, Link } from 'react-router-dom'
import { ProcessSelector } from './components/ProcessSelector'
import { ProcessRenderer } from './components/ProcessRenderer'
import { ToastContainer } from './components/ToastContainer'
import { useProcessStore } from './store/processStore'
import type { ProcessDefinition } from './types'

import taskManagementConfig from './configs/task-management.json'
import specReviewConfig from './configs/spec-review.json'

const DEFINITIONS: ProcessDefinition[] = [
  taskManagementConfig as ProcessDefinition,
  specReviewConfig as ProcessDefinition,
]

function ProcessPage() {
  const { defId, instanceId } = useParams<{ defId: string; instanceId: string }>()
  const instances = useProcessStore((s) => s.instances)

  const definition = DEFINITIONS.find((d) => d.id === defId)
  const instance = instances.find((i) => i.id === instanceId)

  if (!definition) return <NotFound message={`프로세스 정의를 찾을 수 없습니다: ${defId}`} />
  if (!instance) return <NotFound message={`인스턴스를 찾을 수 없습니다: ${instanceId}`} />

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm">← 홈</Link>
        <span className="text-gray-300">|</span>
        <span className="text-sm font-medium text-gray-700">
          {definition.icon} {definition.name}
        </span>
      </header>
      <main className="max-w-3xl mx-auto py-8 px-4">
        <ProcessRenderer definition={definition} instance={instance} />
      </main>
    </div>
  )
}

function NotFound({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-gray-500">{message}</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">홈으로</Link>
      </div>
    </div>
  )
}

function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProcessSelector definitions={DEFINITIONS} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/process/:defId/:instanceId" element={<ProcessPage />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
