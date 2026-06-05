import type React from 'react'
import type { ModuleConfig, ModuleProps } from '../types'
import { FormModule } from '../modules/form/FormModule'
import { ApprovalModule } from '../modules/approval/ApprovalModule'
import { NotificationModule } from '../modules/notification/NotificationModule'
import { DocumentGenModule } from '../modules/document-gen/DocumentGenModule'
import { DashboardModule } from '../modules/dashboard/DashboardModule'

type AnyModuleProps = ModuleProps<Record<string, unknown>>
type ModuleComponent = (props: AnyModuleProps) => React.ReactElement | null

const registry: Record<string, ModuleComponent> = {
  form: FormModule as unknown as ModuleComponent,
  approval: ApprovalModule as unknown as ModuleComponent,
  notification: NotificationModule as unknown as ModuleComponent,
  'document-gen': DocumentGenModule as unknown as ModuleComponent,
  dashboard: DashboardModule as unknown as ModuleComponent,
}

export function resolveModule(moduleConfig: ModuleConfig): ModuleComponent {
  const Component = registry[moduleConfig.type]
  if (!Component) throw new Error(`Unknown module type: ${moduleConfig.type}`)
  return Component
}
