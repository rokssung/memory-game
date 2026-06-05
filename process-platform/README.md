# Process Platform

JSON 설정으로 정의된 업무 프로세스를 **동일한 엔진**이 렌더링·실행하는 메타 시스템.

## 실행

```bash
npm install
npm run dev
```

## 핵심 증명: 코드 수정 없이 JSON만 추가하면 새 프로세스가 생긴다

`src/configs/` 에 JSON 파일을 추가하고, `App.tsx`의 `DEFINITIONS` 배열에 import만 하면 된다.

```ts
// App.tsx — 이 두 줄만 추가
import myNewProcess from './configs/my-new-process.json'
const DEFINITIONS = [...existing, myNewProcess as ProcessDefinition]
```

엔진(`ProcessRenderer`), 모듈(`FormModule`, `ApprovalModule` 등), 상태 저장소는 **변경하지 않는다.**

---

## 아키텍처

```
ProcessDefinition (JSON)
  └── states[]         각 상태가 실행할 모듈 타입 + 설정
  └── transitions[]    상태 전이 규칙 (json-logic 조건)

ProcessInstance (Zustand + localStorage)
  └── context          공유 컨텍스트 (모듈이 읽고 씀)
  └── history[]        상태 이력 스냅샷

ProcessRenderer
  └── 현재 state → 모듈 컴포넌트 해석 (moduleRegistry)
  └── 전이 가능 여부 평가 (json-logic-js)
  └── onTransition → store 업데이트
```

### 모듈 타입

| 타입 | 역할 |
|------|------|
| `form` | 입력 폼. 필드 정의는 config에서, 값은 context에 씀 |
| `approval` | 승인/반려 게이트. `resultKey`(bool)를 context에 씀 |
| `notification` | 메시지 토스트. `autoAdvance: true` 면 자동 전이 |
| `document-gen` | `{{contextKey}}` 템플릿 → 문서 생성·다운로드 |
| `dashboard` | 같은 정의의 모든 인스턴스를 칸반으로 표시 |

### 조건부 전이

전이 조건은 문자열이 아닌 [json-logic](https://jsonlogic.com/) 구조:

```json
{ "==": [{ "var": "approved" }, true] }
```

`null`이면 항상 통과.

---

## 현재 포함된 프로세스

### 📋 과제관리 (`task-management.json`)

```
등록 → 팀장 검토 → 진행 → 완료(칸반)
```

### 📐 사양 검토 (`spec-review.json`)

```
초안 → 동료 검토 → 수정 → 최종 승인 → 문서 발행
              ↑___________|  (수정 요청 시 되돌아옴)
```

---

## 새 프로세스 추가 예시

```json
{
  "id": "leave-request",
  "name": "휴가 신청",
  "version": "1.0.0",
  "icon": "🏖️",
  "contextSchema": { ... },
  "initialState": "apply",
  "states": [
    { "id": "apply",    "label": "신청", "module": { "type": "form",     "config": { ... } } },
    { "id": "approve",  "label": "승인", "module": { "type": "approval", "config": { ... } } },
    { "id": "done",     "label": "완료", "terminal": true, "module": { "type": "notification", "config": { ... } } }
  ],
  "transitions": [
    { "id": "submit", "from": "apply",   "to": "approve", "label": "신청", "trigger": "manual", "condition": null },
    { "id": "ok",     "from": "approve", "to": "done",    "label": "승인", "trigger": "manual", "condition": null }
  ]
}
```
