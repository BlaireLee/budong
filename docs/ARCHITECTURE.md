# Architecture

## Monorepo layout
- `apps/web`: PWA client
- `apps/api`: HTTP API server
- `packages/domain`: business domain modules
- `packages/shared-types`: shared API/domain types
- `packages/ui`: design tokens and simple UI helpers

## Domain modules
- `Identity`: signup, age band mapping
- `Consent`: guardian consent updates
- `Curriculum`: lesson catalog
- `Simulation`: scenario scoring + mastery updates
- `Analytics`: event ingestion + KPI snapshot
- `Monetization`: ad policy engine with legal fallback

## Data and persistence
현재 구현은 in-memory 저장소를 사용합니다. 레포지토리 인터페이스를 유지하면 PostgreSQL/Redis로 교체할 수 있습니다.

## Scaling path
1. `InMemory*Repository`를 DB repository로 교체
2. 이벤트 저장을 큐(Kafka/SQS)로 분리
3. KPI 집계를 배치/스트리밍 파이프라인으로 분리
