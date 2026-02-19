# GitHub + Vercel 현황을 가장 빠르게 보는 방법

## 0) 한 번에 실행 (권장)
1. `.env.local.example`를 참고해 환경변수 설정
2. 아래 한 줄 실행
```bash
./ops/setup-all.sh
```
이 스크립트가 자동으로 수행합니다:
- 테스트 실행
- Vercel용 웹 빌드(`public/`)
- GitHub 라벨/마일스톤/로드맵 이슈 자동 생성
- Vercel 프로젝트 연결 검증

## 1) GitHub에서 보이는 항목
자동 생성/관리:
- 라벨: `phase/0..3`, `blocker`, `backend`, `frontend`, `design`, `analytics`, `ops`
- 마일스톤: 20주 Phase 일정
- 로드맵 이슈: 각 Phase 핵심 액션
- (권한 허용 시) `main` 브랜치 보호 규칙

확인 위치:
- Actions: CI 상태
- Issues: phase별 진행률, blocker 개수
- Pull Requests: 오픈 PR/드래프트 수

## 2) Vercel에서 보이는 항목
자동 검증:
- 프로젝트 연결 정상 여부
- 최신 배포 상태(ready/building/error)
- 최신 배포 URL

GitHub Actions 배포 워크플로 포함:
- `/Users/isohui/Documents/budong/.github/workflows/deploy-vercel.yml`

필요한 GitHub Secret:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 3) 제품 내부 대시보드에서 한 화면으로 보기
- 웹: `http://localhost:3000`
- 섹션: `6) 개발/배포 현황 (GitHub + Vercel)`
- API: `GET /v1/ops/status`

핵심 필드:
- `ops.github.latest_ci`
- `ops.github.open_pull_requests`
- `ops.github.blocker_issues`
- `ops.github.phase_progress`
- `ops.vercel.latest_deployment`
- `ops.vercel.recent_success_rate`

## 4) 필요한 환경변수
```bash
export GITHUB_OWNER=your-org-or-id
export GITHUB_REPO=your-repo
export GITHUB_TOKEN=ghp_xxx

export VERCEL_TOKEN=xxx
export VERCEL_PROJECT_ID=prj_xxx
export VERCEL_TEAM_ID=team_xxx     # optional
export VERCEL_ORG_ID=team_or_user   # for GitHub Actions secrets setup
```

## 5) 결과 리포트 파일
자동 실행 후 아래 파일이 생성됩니다.
- `/Users/isohui/Documents/budong/docs/INTEGRATION_BOOTSTRAP_REPORT.md`
