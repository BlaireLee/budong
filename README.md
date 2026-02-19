# Budong Academy

중학생이 실생활 부동산 의사결정을 연습할 수 있는 학습 서비스 모노레포입니다.

## 구조
- `apps/api`: 학습/광고/이벤트 API
- `apps/web`: 모바일 웹(PWA) 프런트엔드
- `packages/domain`: 도메인 로직(Identity, Consent, Curriculum, Simulation, Analytics, Monetization)
- `packages/ui`: 디자인 토큰/공용 UI 유틸
- `packages/shared-types`: 공용 타입 정의(`.d.ts`)
- `tests`: API 및 도메인 테스트
- `docs`: KPI/운영/로드맵 문서

## 빠른 시작
1. API 실행: `npm run dev:api`
2. 웹 실행: `npm run dev:web`
3. 테스트 실행: `npm test`

기본 주소:
- 웹: `http://localhost:3000`
- API: `http://localhost:3001`

## GitHub + Vercel 현황 대시보드
- 웹 화면의 `6) 개발/배포 현황 (GitHub + Vercel)` 섹션에서 확인할 수 있습니다.
- API 엔드포인트: `GET /v1/ops/status`
- 설정 방법: `docs/GITHUB_VERCEL_VISUAL_STATUS_KO.md`
- 원클릭 세팅: `./ops/setup-all.sh` (옵션: `.env.local` 자동 로드)
- 배포 구조: `docs/DEPLOYMENT_VERCEL.md`
- 실행 체크리스트: `docs/ONE_CLICK_CHECKLIST_KO.md`

## 브랜딩/디자인 시스템
- 브랜딩 컨셉 + 토큰 + 경쟁력 점검 기준: `docs/BRANDING_DESIGN_SYSTEM_V1_KO.md`

## 설계 원칙
- 도메인 우선 분리: 서비스/저장소/정책 엔진 분리
- 확장성: in-memory 저장소를 인터페이스화하여 DB 교체 가능
- 안정성: 입력 검증 + 정책 기반 광고 결정 + 테스트 우선
- 측정 가능성: 이벤트 파이프라인 및 KPI 집계 서비스 포함
