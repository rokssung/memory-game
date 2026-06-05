# 모듈형 프로세스 관리 플랫폼 — 아키텍처 계획

## 디렉토리 구조

```
src/
  types.ts                    # 모든 계약 타입
  engine/
    processEngine.ts          # 상태 전이 실행기
    moduleRegistry.ts         # 모듈 타입 → 컴포넌트 매핑
  modules/
    form/
      FormModule.tsx
      schema.ts               # configSchema / inputSchema / outputSchema
    approval/
      ApprovalModule.tsx
      schema.ts
    notification/
      NotificationModule.tsx
      schema.ts
    document-gen/
      DocumentGenModule.tsx
      schema.ts
    dashboard/
      DashboardModule.tsx
      schema.ts
  store/
    processStore.ts           # Zustand: 인스턴스 상태, 컨텍스트 변수
    notificationStore.ts      # 토스트 큐
  components/
    ProcessRenderer.tsx       # 핵심: config 받아 현재 state 렌더링
    ProcessSelector.tsx       # 어떤 프로세스 실행할지 선택
    StepNav.tsx               # 현재 state / 이력 표시
    ToastContainer.tsx
  configs/
    task-management.json
    spec-review.json
  App.tsx
```

---

## 핵심 타입 설계 (types.ts)

### 1. 모듈 계약

```ts
interface ModuleContract<TConfig, TInput, TOutput> {
  type: string
  configSchema: TConfig          // 프로세스 정의 시 작성자가 채우는 값
  inputFields: (keyof TInput)[]  // 공유 컨텍스트에서 읽는 필드들
  outputFields: (keyof TOutput)[] // 공유 컨텍스트에 쓰는 필드들
}
```

### 2. 공유 컨텍스트 (Process Variables)

인스턴스마다 하나의 `Record<string, unknown>` 객체.
모듈은 `inputFields`로 읽고, `outputFields`로 쓴다.
상태 전이 시 컨텍스트 스냅샷을 히스토리에 누적.

### 3. 프로세스 정의 (JSON 스키마)

```ts
interface ProcessDefinition {
  id: string
  name: string
  version: string
  contextSchema: Record<string, FieldDef>  // 컨텍스트 전체 필드 선언
  states: State[]
  transitions: Transition[]
  initialState: string
}

interface State {
  id: string
  label: string
  module: ModuleConfig       // 이 state에서 실행될 모듈
}

interface Transition {
  id: string
  from: string
  to: string
  trigger: 'manual' | 'auto'  // manual = 사용자 버튼, auto = 모듈 완료 시
  condition?: string           // 컨텍스트 필드 기반 간단 조건식 (예: "approved === true")
  label: string
}

interface ModuleConfig {
  type: 'form' | 'approval' | 'notification' | 'document-gen' | 'dashboard'
  config: Record<string, unknown>  // 각 모듈 타입별 configSchema
}
```

### 4. 런타임 인스턴스

```ts
interface ProcessInstance {
  id: string
  definitionId: string
  definitionVersion: string    // 시작 시점에 pin
  currentState: string
  context: Record<string, unknown>   // 공유 컨텍스트
  history: HistoryEntry[]
  createdAt: string
  updatedAt: string
}

interface HistoryEntry {
  stateId: string
  enteredAt: string
  exitedAt?: string
  transitionId?: string
  contextSnapshot: Record<string, unknown>
}
```

---

## 상태머신 엔진 동작

1. `ProcessInstance` 로드 → `currentState` 확인
2. `states[currentState].module` 렌더링
3. 모듈이 완료 이벤트 발생 → 컨텍스트에 output 필드 쓰기
4. 가능한 `transitions` 평가 (condition 검사)
5. 선택된 transition으로 `currentState` 전이
6. 히스토리 엔트리 추가

---

## 두 프로세스 정의

### task-management.json

```
states: create → review → in-progress → done
modules: form → approval → form → dashboard
```

- `create`: 제목/설명/담당자/우선순위 입력 (form)
- `review`: 팀장 승인 게이트 (approval)
- `in-progress`: 진행 메모 입력 (form)
- `done`: 대시보드 칸반 반영 (dashboard)

### spec-review.json

```
states: draft → peer-review → revision → approved → published
modules: form → approval → form → approval → document-gen
```

- `draft`: 사양서 제목/내용 입력 (form)
- `peer-review`: 동료 검토 (approval)
- `revision`: 수정 사항 반영 (form)
- `approved`: 최종 승인 (approval)
- `published`: 사양서 문서 생성 (document-gen)

---

## ProcessRenderer 계약

```tsx
<ProcessRenderer
  definition={ProcessDefinition}
  instance={ProcessInstance}
  onTransition={(transitionId: string) => void}
  onContextUpdate={(patch: Record<string, unknown>) => void}
/>
```

---

## 수직 슬라이스 순서

1. `types.ts` 전체 타입 정의
2. `processStore.ts` (Zustand)
3. `form` 모듈 end-to-end (FormModule → ProcessRenderer → 상태 전이)
4. `task-management.json` 단순 버전으로 form만으로 동작 확인
5. 나머지 모듈 (approval → notification → document-gen → dashboard)
6. `spec-review.json` 추가
7. ProcessSelector (홈 화면)
8. README 작성

---

## 결정 사항 — 확인 필요

1. **라우팅**: React Router 사용 여부? (인스턴스 URL `/process/:defId/:instanceId`)
   → 없어도 되면 단순 Zustand 뷰 상태로 처리
2. **localStorage 동기화**: 페이지 새로고침 시 인스턴스 유지 여부?
3. **다중 인스턴스**: 하나의 프로세스에 여러 인스턴스를 동시에 만들 수 있나?
   (대시보드 칸반에서 여러 카드 필요하면 yes)
4. **조건 분기**: transition condition을 `eval`로 처리? (simple JSONLogic 라이브러리 사용?)
   → MVP는 `approved === true` 정도의 단순 비교만 지원?
