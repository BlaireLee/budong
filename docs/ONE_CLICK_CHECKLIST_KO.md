# 원클릭 실행 체크리스트

## 실행 전 (한 번)
1. GitHub repo 생성 후 코드 push
2. Vercel에서 repo import
3. 아래 값 준비
   - GitHub: `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN`
   - Vercel: `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (`VERCEL_TEAM_ID` optional)

## 실행
```bash
./ops/setup-all.sh
```

## 실행 후 확인
1. `/Users/isohui/Documents/budong/docs/INTEGRATION_BOOTSTRAP_REPORT.md` 생성 확인
2. `http://localhost:3000` 접속
3. `6) 개발/배포 현황` 섹션 상태 확인
4. GitHub Actions에서 `CI`와 `Deploy (Vercel)` 상태 확인
