#!/bin/bash
# 자동 배포 데몬 (폴링 방식 - 3초마다 변경 감지)
# 터미널에서 한 번만 실행하세요: bash ~/Documents/Claude/auto_deploy.sh

DIR="$HOME/Documents/Claude"
cd "$DIR"

echo "🚀 자동 배포 데몬 시작 (폴링 방식)"
echo "   감시 중: $DIR"
echo "   종료: Ctrl+C"
echo ""

while true; do
  sleep 3

  cd "$DIR" 2>/dev/null || continue

  # 변경된 파일 있으면 커밋+푸시
  if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    TIMESTAMP=$(date '+%H:%M:%S')
    git add -A

    if git diff --cached --quiet; then
      continue
    fi

    git commit -m "🤖 자동 배포 $TIMESTAMP" --quiet

    if git push --quiet 2>/dev/null; then
      echo "✅ [$TIMESTAMP] 배포 완료!"
    else
      echo "❌ [$TIMESTAMP] 푸시 실패 (토큰 만료 가능성)"
    fi
  fi
done
