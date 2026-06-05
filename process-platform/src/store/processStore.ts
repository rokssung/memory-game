import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ProcessInstance, ProcessContext, HistoryEntry } from '../types'

interface ProcessStore {
  instances: ProcessInstance[]
  createInstance: (instance: ProcessInstance) => void
  updateContext: (instanceId: string, patch: ProcessContext) => void
  transition: (
    instanceId: string,
    transitionId: string,
    transitionLabel: string,
    nextStateId: string,
    nextStateLabel: string,
    isFinal: boolean,
    status?: ProcessInstance['status'],
  ) => void
  deleteInstance: (instanceId: string) => void
}

export const useProcessStore = create<ProcessStore>()(
  persist(
    (set) => ({
      instances: [],

      createInstance: (instance) =>
        set((s) => ({ instances: [...s.instances, instance] })),

      updateContext: (instanceId, patch) =>
        set((s) => ({
          instances: s.instances.map((inst) =>
            inst.id === instanceId
              ? { ...inst, context: { ...inst.context, ...patch }, updatedAt: new Date().toISOString() }
              : inst,
          ),
        })),

      transition: (instanceId, transitionId, transitionLabel, nextStateId, nextStateLabel, isFinal, status) =>
        set((s) => ({
          instances: s.instances.map((inst) => {
            if (inst.id !== instanceId) return inst

            const now = new Date().toISOString()

            // close the current history entry
            const updatedHistory: HistoryEntry[] = inst.history.map((h, i) =>
              i === inst.history.length - 1
                ? { ...h, exitedAt: now, transitionId, transitionLabel }
                : h,
            )

            // open a new history entry for the next state
            const newEntry: HistoryEntry = {
              stateId: nextStateId,
              stateLabel: nextStateLabel,
              enteredAt: now,
              contextSnapshot: { ...inst.context },
            }

            return {
              ...inst,
              currentState: nextStateId,
              status: status ?? (isFinal ? 'completed' : 'active'),
              history: [...updatedHistory, newEntry],
              updatedAt: now,
            }
          }),
        })),

      deleteInstance: (instanceId) =>
        set((s) => ({ instances: s.instances.filter((i) => i.id !== instanceId) })),
    }),
    { name: 'process-platform-instances' },
  ),
)
