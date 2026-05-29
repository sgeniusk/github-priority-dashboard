#!/usr/bin/env bash
# github-priority-dashboard — 새 세션 시작 시 가장 먼저 돌릴 시작 진단.
# 데이터 무결성·환경·기준일을 빠르게 점검하고 다음 액션을 안내한다.
set -e
cd "$(dirname "$0")"

ok()  { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn(){ printf "  \033[33m⚠\033[0m %s\n" "$1"; }
err() { printf "  \033[31m✗\033[0m %s\n" "$1"; }

echo "▶ JSON 무결성"
fail=0
for f in projects.json suggestions.json usage.json history.json activity.json reports.json journal.json; do
  if [ -f "$f" ]; then
    if node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>/dev/null; then
      ok "$f"
    else
      err "$f 파싱 실패"; fail=1
    fi
  else
    warn "$f 없음"
  fi
done
[ "$fail" = "1" ] && { echo; err "JSON 파싱 실패가 있습니다 — 먼저 고치세요"; exit 1; }

echo "▶ 핵심 파일 존재"
for f in dashboard.html scripts/refresh-progress.mjs CLAUDE.md projects.schema.md feature_list.json progress.md; do
  [ -f "$f" ] && ok "$f" || warn "$f 없음"
done

echo "▶ GitHub 인증 (refresh 가능 여부)"
if [ -n "$GH_TOKEN" ]; then
  ok "GH_TOKEN 환경변수 설정됨"
elif gh auth token >/dev/null 2>&1; then
  ok "gh auth token 사용 가능"
else
  warn "GitHub 토큰 없음 — /refresh·refresh-progress.mjs가 실패합니다"
fi

echo "▶ 데이터 기준일"
asOf=$(node -e "console.log(JSON.parse(require('fs').readFileSync('projects.json','utf8')).meta.asOf)")
today=$(date +%Y-%m-%d)
if [ "$asOf" = "$today" ]; then
  ok "meta.asOf $asOf — 오늘자"
else
  warn "meta.asOf $asOf (오늘 $today) — /refresh로 갱신 권장"
fi

echo "▶ 현재 작업"
active=$(node -e "console.log(JSON.parse(require('fs').readFileSync('feature_list.json','utf8')).active)" 2>/dev/null || echo "(feature_list.json 없음)")
echo "  active feature: $active"
echo "  상세 — progress.md, feature_list.json"

echo
echo "다음 → progress.md '다음 액션'을 보고 작업 재개. /refresh가 필요하면 그것부터."
