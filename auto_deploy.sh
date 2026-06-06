#!/bin/bash
# 자동 배포 데몬 (폴링 방식 - 3초마다 변경 감지)
# 터미널에서 한 번만 실행하세요: bash ~/Documents/Claude/auto_deploy.sh

DIR="$HOME/Documents/Claude"

# ── 시작 전 검증 ──────────────────────────────────────────
cd "$DIR" || { echo "❌ 디렉토리 없음: $DIR"; exit 1; }

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "❌ git 저장소가 아닙니다: $DIR"
  echo "   먼저 'git init' 또는 'git clone'을 실행하세요."
  exit 1
fi

# ── Ctrl+C 핸들러 ─────────────────────────────────────────
trap 'echo ""; echo "🛑 자동 배포 데몬 종료"; exit 0' INT TERM

echo "🚀 자동 배포 데몬 시작 (폴링 방식)"
echo "   감시 중: $DIR"
echo "   종료: Ctrl+C"
echo ""

# ── 메인 루프 ─────────────────────────────────────────────
while true; do
  sleep 3

  cd "$DIR" 2>/dev/null || continue

  if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
    continue
  fi

  TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

  # 변경 파일 목록 수집 (커밋 메시지 및 출력용)
  CHANGED=$(git status --porcelain | awk '{print $2}' | tr '\n' ' ')

  git add -A

  # stage된 게 없으면 (예: 무시된 파일만 변경) 스킵
  if git diff --cached --quiet; then
    continue
  fi

  git commit -m "🤖 자동 배포 $(date '+%H:%M:%S')" --quiet

  PUSH_ERR=$(git push 2>&1)
  if [ $? -eq 0 ]; then
    echo "✅ [$TIMESTAMP] git push 완료 → $CHANGED"
  else
    echo "❌ [$TIMESTAMP] 푸시 실패: $PUSH_ERR"
  fi

  # Firebase Hosting 배포
  FIREBASE_ERR=$(firebase deploy --only hosting --project game-3ce55 --quiet 2>&1)
  if [ $? -eq 0 ]; then
    echo "🔥 [$TIMESTAMP] Firebase 배포 완료"
  else
    echo "❌ [$TIMESTAMP] Firebase 배포 실패: $FIREBASE_ERR"
  fi
done
