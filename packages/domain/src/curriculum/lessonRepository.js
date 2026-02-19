const LESSONS = [
  {
    id: 'kr-lease-basics',
    topic: '월세 구조 이해',
    difficulty: 'easy',
    estimated_minutes: 8,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '한 달 예산 40만 원으로 자취방을 구하려고 해요. 보증금이 낮은 대신 월세가 높은 집과 보증금이 높은 대신 월세가 낮은 집 중 무엇이 더 유리할까요?',
    options: ['보증금 100만/월세 45만', '보증금 500만/월세 30만', '보증금 없이 월세 55만'],
    correct_option: 1,
    feedback_by_option: [
      '초기 부담은 적지만 장기적으로 월 고정비가 커집니다.',
      '장기 거주라면 총비용을 줄이기 유리한 조합입니다.',
      '초기비용은 낮아도 월세 부담이 가장 큽니다.',
    ],
  },
  {
    id: 'kr-deposit-risk',
    topic: '보증금 리스크',
    difficulty: 'medium',
    estimated_minutes: 10,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '전세 계약 전 집주인 체납 여부를 확인하지 않으면 어떤 위험이 있을까요?',
    options: ['이사 날짜만 늦어진다', '보증금 반환이 어려울 수 있다', '관리비가 조금 오른다'],
    correct_option: 1,
    feedback_by_option: [
      '핵심 위험은 일정이 아니라 보증금 회수 실패입니다.',
      '맞아요. 체납/권리관계 문제는 보증금 반환 위험으로 이어질 수 있습니다.',
      '관리비보다 보증금 반환 리스크가 훨씬 큽니다.',
    ],
  },
  {
    id: 'kr-jeonse-vs-rent',
    topic: '전세 vs 월세 판단',
    difficulty: 'medium',
    estimated_minutes: 9,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '2년 거주 예정, 전세대출 금리 4%, 월세는 35만 원일 때 무엇을 먼저 비교해야 할까요?',
    options: ['인테리어 예쁨', '총거주비용(이자+월세)', '집주인 나이'],
    correct_option: 1,
    feedback_by_option: [
      '취향 요소보다 비용 계산이 먼저입니다.',
      '정답입니다. 기간 동안 총 비용 비교가 핵심입니다.',
      '나이는 법적 안정성과 직접 관련이 없습니다.',
    ],
  },
  {
    id: 'kr-maintenance-fee',
    topic: '관리비 읽기',
    difficulty: 'easy',
    estimated_minutes: 7,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '월세 30만 원, 관리비 15만 원인 매물은 실제 월 부담을 어떻게 봐야 할까요?',
    options: ['월 30만 원', '월 45만 원 이상 가능', '관리비는 무시'],
    correct_option: 1,
    feedback_by_option: [
      '관리비를 제외하면 실제 비용을 과소평가하게 됩니다.',
      '맞아요. 항목별 포함/별도 여부까지 확인해야 합니다.',
      '관리비는 실질 주거비의 중요한 요소입니다.',
    ],
  },
  {
    id: 'kr-contract-checklist',
    topic: '계약 전 체크리스트',
    difficulty: 'medium',
    estimated_minutes: 11,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '계약 당일 가장 먼저 확인할 항목은 무엇일까요?',
    options: ['벽지 색상', '등기부/신분/계약 당사자 일치', '현관 비밀번호'],
    correct_option: 1,
    feedback_by_option: [
      '외관보다 권리관계 검증이 우선입니다.',
      '정답입니다. 계약 상대방과 권리관계 일치 확인이 필수입니다.',
      '보안 정보보다 법적 검증이 먼저입니다.',
    ],
  },
  {
    id: 'kr-loan-intro',
    topic: '대출 기초',
    difficulty: 'medium',
    estimated_minutes: 10,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '대출 금리가 1%p 오르면 가장 먼저 어떤 영향이 생길까요?',
    options: ['보증금 감소', '월 이자 증가', '관리비 자동 인하'],
    correct_option: 1,
    feedback_by_option: [
      '보증금은 계약조건에 따라 별도입니다.',
      '맞습니다. 이자 부담이 즉시 증가합니다.',
      '금리와 관리비 인하는 직접 연동되지 않습니다.',
    ],
  },
  {
    id: 'kr-neighborhood-check',
    topic: '입지 실사',
    difficulty: 'easy',
    estimated_minutes: 8,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '학교와 지하철 접근성 외에 꼭 확인해야 할 생활 지표는?',
    options: ['편의시설·치안·소음', '건물 이름 길이', '중개사무소 크기'],
    correct_option: 0,
    feedback_by_option: [
      '정답입니다. 실제 생활 만족도를 좌우하는 핵심 지표입니다.',
      '이름은 거주 품질을 보장하지 않습니다.',
      '사무소 규모보다 지역 생활환경이 중요합니다.',
    ],
  },
  {
    id: 'kr-fraud-warning',
    topic: '사기 경고 신호',
    difficulty: 'hard',
    estimated_minutes: 12,
    language: 'ko',
    locale: 'KR',
    version: '1.0.0',
    scenario: '시세보다 지나치게 싼 매물이면서 계약을 급하게 재촉할 때 가장 적절한 대응은?',
    options: ['바로 계약금 송금', '권리관계 재확인 후 보류', '친구 의견만 듣고 진행'],
    correct_option: 1,
    feedback_by_option: [
      '즉시 송금은 가장 위험한 행동입니다.',
      '정답입니다. 검증 완료 전에는 계약을 보류해야 합니다.',
      '비공식 조언만으로 결정하면 리스크가 큽니다.',
    ],
  },
  {
    id: 'en-rent-vs-buy-basic',
    topic: 'Rent vs Buy Basics',
    difficulty: 'easy',
    estimated_minutes: 8,
    language: 'en',
    locale: 'US',
    version: '1.0.0',
    scenario: 'You plan to stay for only one year. What should be prioritized first?',
    options: ['Total one-year housing cost', 'House paint color', 'Agent social media followers'],
    correct_option: 0,
    feedback_by_option: [
      'Correct. A short time horizon requires a total-cost comparison first.',
      'Visual preference is secondary to financial fit.',
      'Popularity does not replace cost analysis.',
    ],
  },
  {
    id: 'en-security-deposit',
    topic: 'Security Deposit Safety',
    difficulty: 'medium',
    estimated_minutes: 9,
    language: 'en',
    locale: 'US',
    version: '1.0.0',
    scenario: 'What protects a tenant most before paying a deposit?',
    options: ['Verifying landlord identity and lease terms', 'Paying cash quickly', 'Skipping written lease'],
    correct_option: 0,
    feedback_by_option: [
      'Correct. Identity and written terms reduce fraud risk.',
      'Speedy cash payment increases risk.',
      'A written lease is essential for legal protection.',
    ],
  },
  {
    id: 'en-credit-loan-basic',
    topic: 'Credit and Loan Basics',
    difficulty: 'medium',
    estimated_minutes: 10,
    language: 'en',
    locale: 'US',
    version: '1.0.0',
    scenario: 'If interest rates rise, what likely happens to monthly loan payments?',
    options: ['They usually increase', 'They always become zero', 'They are unrelated'],
    correct_option: 0,
    feedback_by_option: [
      'Correct. Higher rates generally increase borrowing costs.',
      'Payments cannot drop to zero due to rate increases.',
      'Rates and payments are directly related.',
    ],
  },
  {
    id: 'en-tenant-rights-core',
    topic: 'Core Tenant Rights',
    difficulty: 'easy',
    estimated_minutes: 7,
    language: 'en',
    locale: 'US',
    version: '1.0.0',
    scenario: 'Which document is most important when resolving a landlord dispute?',
    options: ['Signed lease agreement', 'Property logo', 'A text from a friend'],
    correct_option: 0,
    feedback_by_option: [
      'Correct. The signed lease defines rights and obligations.',
      'Branding is not legal evidence.',
      'Informal messages are not primary legal proof.',
    ],
  },
];

export class InMemoryLessonRepository {
  constructor(lessons = LESSONS) {
    this.lessons = lessons;
  }

  list({ language } = {}) {
    if (!language) {
      return [...this.lessons];
    }

    return this.lessons.filter((lesson) => lesson.language === language);
  }

  findById(id) {
    return this.lessons.find((lesson) => lesson.id === id) ?? null;
  }
}
