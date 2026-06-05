#!/bin/bash
# 자동 배포 데몬 - 터미널에서 한 번만 실행하세요
# 파일이 바뀔 때마다 자동으로 GitHub에 푸시 → Netlify 자동 배포

DIR="$HOME/Documents/Claude"
cd "$DIR"

echo "🚀 자동 배포 데몬 시작"
echo "   감시 중: $DIR"
echo "   종료: Ctrl+C"
echo ""

# fswatch 없으면 설치 (Homebrew 필요)
if ! command -v fswatch &>/dev/null; then
  echo "📦 fswatch 설치 중..."
  brew install fswatch
fi

# 파일 변경 감지 → 자동 push
fswatch -o "$DIR" \
  --exclude='\.git' \
  --exclude='auto_deploy\.sh' \
  --exclude='setup_deploy\.sh' \
  --exclude='\.DS_Store' \
  --latency 2 \
  | while read -r; do
    sleep 1  # 파일 쓰기 완료 대기
    cd "$DIR"

    # 변경된 파일이 있을 때만 커밋
    if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git status --porcelain)" ]; then
      TIMESTAMP=$(date '+%H:%M:%S')
      git add -A
      git commit -m "🤖 자동 배포 $TIMESTAMP" --quiet

      if git push --quiet 2>&1; then
        echo "✅ [$TIMESTAMP] 배포 완료!"
      else
        echo "❌ [$TIMESTAMP] 푸시 실패 - 토큰 만료 가능성"
      fi
    fi
  done
