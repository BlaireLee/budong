const defaultApiBase =
  window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
const API_BASE = (window.localStorage.getItem('api_base') || defaultApiBase).replace(/\/$/, '');

const KPI_TARGETS = {
  walc: 4000,
  activation_rate_24h: 0.6,
  d7_retention: 0.35,
  avg_learning_score_improvement: 20,
  arpdau_krw: 35,
  arpdau_usd: 70,
};

const state = {
  userId: null,
  country: 'KR',
  sessionId: `session_${Date.now()}`,
  sessionStartedAt: null,
  firstMissionCompletedAt: null,
  lessons: [],
  selectedLesson: null,
  selectedLessonDetail: null,
  completedLessonIds: new Set(),
  attemptCount: 0,
  correctAttempts: 0,
  latestOps: null,
};

const elements = {
  signupForm: document.querySelector('#signup-form'),
  signupResult: document.querySelector('#signup-result'),
  lessons: document.querySelector('#lessons'),
  simulationCard: document.querySelector('#simulation-card'),
  refreshLessons: document.querySelector('#refresh-lessons'),
  grantConsent: document.querySelector('#grant-consent'),
  checkAdMode: document.querySelector('#check-ad-mode'),
  adsResult: document.querySelector('#ads-result'),
  refreshKpi: document.querySelector('#refresh-kpi'),
  kpiCards: document.querySelector('#kpi-cards'),
  refreshOps: document.querySelector('#refresh-ops'),
  refreshOpsHero: document.querySelector('#refresh-ops-hero'),
  opsCards: document.querySelector('#ops-cards'),
  opsResult: document.querySelector('#ops-result'),
  journeyProgressFill: document.querySelector('#journey-progress-fill'),
  journeyProgressLabel: document.querySelector('#journey-progress-label'),
  journeyMeta: document.querySelector('#journey-meta'),
  heroUserPill: document.querySelector('#hero-user-pill'),
  heroCountryPill: document.querySelector('#hero-country-pill'),
  heroAhaPill: document.querySelector('#hero-aha-pill'),
  advantageCards: document.querySelector('#advantage-cards'),
  designScore: document.querySelector('#design-score'),
};

function sanitize(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatPercent(value) {
  return `${Math.round(Number(value) * 100)}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('ko-KR').format(Number(value) || 0);
}

function difficultyLabel(value) {
  const map = {
    easy: '쉬움',
    medium: '보통',
    hard: '어려움',
  };

  return map[value] ?? value;
}

function setToneClass(element, tone) {
  element.classList.remove('ok', 'warning', 'danger', 'neutral');
  element.classList.add(tone);
}

function setResult(element, text, isError = false) {
  element.textContent = text;
  setToneClass(element, isError ? 'danger' : 'ok');
}

function setWarning(element, text) {
  element.textContent = text;
  setToneClass(element, 'warning');
}

function setNeutral(element, text) {
  element.textContent = text;
  setToneClass(element, 'neutral');
}

function setChip(element, text, tone = 'neutral') {
  element.textContent = text;
  setToneClass(element, tone);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error ?? '요청 실패');
  }

  return data;
}

function getFirstValueMinutes() {
  if (!state.sessionStartedAt || !state.firstMissionCompletedAt) {
    return null;
  }

  return (state.firstMissionCompletedAt - state.sessionStartedAt) / 60000;
}

function updateHeroPills() {
  if (state.userId) {
    const shortId = state.userId.replace('user_', 'U-');
    setChip(elements.heroUserPill, `학습자 ${shortId}`, 'ok');
  } else {
    setChip(elements.heroUserPill, '로그인 전', 'neutral');
  }

  setChip(elements.heroCountryPill, `국가 ${state.country}`, 'neutral');

  const firstValueMinutes = getFirstValueMinutes();
  if (firstValueMinutes == null) {
    setChip(elements.heroAhaPill, '아하 모먼트 미측정', 'neutral');
    return;
  }

  if (firstValueMinutes <= 5) {
    setChip(elements.heroAhaPill, `아하 ${firstValueMinutes.toFixed(1)}분`, 'ok');
    return;
  }

  setChip(elements.heroAhaPill, `아하 ${firstValueMinutes.toFixed(1)}분`, 'warning');
}

function updateJourneyPanel() {
  const total = state.lessons.length;
  const completed = state.completedLessonIds.size;
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.journeyProgressLabel.textContent = `미션 ${completed} / ${total} 완료`;
  elements.journeyProgressFill.style.width = `${progress}%`;
  elements.journeyProgressFill.parentElement.setAttribute('aria-valuenow', String(progress));

  const firstValueMinutes = getFirstValueMinutes();
  if (!state.userId) {
    elements.journeyMeta.textContent = '프로필을 설정하면 개인 맞춤 미션과 진행률이 활성화됩니다.';
  } else if (firstValueMinutes == null) {
    elements.journeyMeta.textContent =
      '첫 미션 완료까지 시간을 측정 중입니다. 목표는 5분 이내입니다.';
  } else if (firstValueMinutes <= 5) {
    elements.journeyMeta.textContent = `좋아요. 첫 가치 도달 시간 ${firstValueMinutes.toFixed(1)}분으로 목표를 달성했습니다.`;
  } else {
    elements.journeyMeta.textContent = `첫 가치 도달 시간 ${firstValueMinutes.toFixed(1)}분입니다. 온보딩을 더 단순화해 개선하세요.`;
  }

  updateHeroPills();
}

function renderLessons() {
  if (state.lessons.length === 0) {
    elements.lessons.innerHTML = '<p class="result neutral">현재 선택된 언어의 미션이 없습니다.</p>';
    updateJourneyPanel();
    return;
  }

  elements.lessons.innerHTML = state.lessons
    .map((lesson) => {
      const completed = state.completedLessonIds.has(lesson.lesson_id);
      const difficulty = sanitize(lesson.difficulty);
      const topic = sanitize(lesson.topic);
      const version = sanitize(lesson.version);

      return `
        <article class="lesson-card ${completed ? 'is-completed' : ''}" role="listitem">
          <div class="lesson-meta">
            <span class="chip lang">${sanitize(lesson.language.toUpperCase())}</span>
            <span class="chip diff-${difficulty}">${sanitize(difficultyLabel(lesson.difficulty))}</span>
            <span class="chip">${sanitize(String(lesson.estimated_minutes))}분</span>
          </div>
          <h4>${topic}</h4>
          <p class="lesson-foot">버전 ${version}</p>
          <button data-lesson-id="${sanitize(lesson.lesson_id)}" class="btn ${completed ? 'subtle' : 'primary'} start-lesson" type="button">
            ${completed ? '다시 풀기' : '이 미션 시작'}
          </button>
        </article>
      `;
    })
    .join('');

  for (const button of elements.lessons.querySelectorAll('.start-lesson')) {
    button.addEventListener('click', async () => {
      const lesson = state.lessons.find((item) => item.lesson_id === button.dataset.lessonId);
      state.selectedLesson = lesson;

      try {
        state.selectedLessonDetail = await api(`/v1/lessons/${lesson.lesson_id}`);
        renderSimulationCard();
      } catch (error) {
        setResult(elements.signupResult, error.message, true);
      }
    });
  }

  updateJourneyPanel();
}

function renderSimulationPlaceholder() {
  elements.simulationCard.innerHTML = `
    <p class="result neutral">미션을 선택하면 상황형 실습이 시작됩니다.</p>
    <ul>
      <li>1문항 1핵심 판단을 훈련합니다.</li>
      <li>오답도 즉시 피드백을 받아 다음 선택을 개선합니다.</li>
      <li>첫 미션 완료까지 5분 이내 달성을 목표로 합니다.</li>
    </ul>
  `;
}

function renderSimulationCard() {
  if (!state.selectedLesson || !state.selectedLessonDetail) {
    renderSimulationPlaceholder();
    return;
  }

  const optionsHtml = state.selectedLessonDetail.options
    .map(
      (option, index) => `
      <label class="option-item">
        <input type="radio" name="option" value="${index}" ${index === 0 ? 'checked' : ''} />
        <span>${sanitize(option)}</span>
      </label>
    `,
    )
    .join('');

  elements.simulationCard.innerHTML = `
    <h4>${sanitize(state.selectedLesson.topic)}</h4>
    <p class="scenario-text">${sanitize(state.selectedLessonDetail.scenario)}</p>
    <p class="sim-meta">문항 ID: ${sanitize(state.selectedLesson.lesson_id)}</p>
    <form id="simulation-form">
      <div class="option-list">
        ${optionsHtml}
      </div>
      <label>
        선택 이유
        <textarea id="rationale-text" rows="2" placeholder="왜 이렇게 골랐는지 적어보세요."></textarea>
      </label>
      <button type="submit" class="btn primary">제출하고 피드백 받기</button>
    </form>
    <p id="simulation-result" class="result neutral">아직 제출 전입니다.</p>
  `;

  const form = document.querySelector('#simulation-form');
  const result = document.querySelector('#simulation-result');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!state.userId) {
      setResult(result, '먼저 계정을 생성해주세요.', true);
      return;
    }

    try {
      const checked = document.querySelector('input[name="option"]:checked');
      const choiceIndex = Number(checked?.value);
      const rationaleText = document.querySelector('#rationale-text').value;

      const response = await api(`/v1/simulations/${state.selectedLesson.lesson_id}/attempts`, {
        method: 'POST',
        body: JSON.stringify({
          user_id: state.userId,
          choices: [choiceIndex],
          rationale_text: rationaleText,
        }),
      });

      state.attemptCount += 1;
      if (response.score >= 100) {
        state.correctAttempts += 1;
      }

      state.completedLessonIds.add(state.selectedLesson.lesson_id);
      if (!state.firstMissionCompletedAt) {
        state.firstMissionCompletedAt = Date.now();
      }

      await api('/v1/events', {
        method: 'POST',
        body: JSON.stringify({
          event_name: 'lesson_completed',
          user_id: state.userId,
          session_id: state.sessionId,
          props: {
            lesson_id: state.selectedLesson.lesson_id,
            score: response.score,
            country: state.country,
          },
        }),
      });

      setResult(
        result,
        `점수 ${response.score}점 | 피드백: ${response.feedback} | 숙련도: ${response.mastery_update.new_level}`,
      );

      renderLessons();
      updateJourneyPanel();
      renderAdvantageBoard();
      await loadKpis();
    } catch (error) {
      setResult(result, error.message, true);
    }
  });
}

function toneByState(value) {
  if (['healthy', 'success', 'ready'].includes(value)) {
    return 'ok';
  }

  if (['error', 'failed'].includes(value)) {
    return 'danger';
  }

  if (['warning', 'running', 'building', 'unknown'].includes(value)) {
    return 'warning';
  }

  return 'neutral';
}

function renderOpsCard({ title, state: rawState, body, link }) {
  const normalizedState = String(rawState ?? 'unknown');
  const tone = toneByState(normalizedState);
  const linkHtml = link
    ? `<a href="${sanitize(link)}" target="_blank" rel="noreferrer">자세히 보기</a>`
    : '';

  return `
    <article class="ops-card">
      <p class="ops-title">${sanitize(title)}</p>
      <span class="status-pill ${tone}">${sanitize(normalizedState)}</span>
      <p class="ops-body">${sanitize(body)}</p>
      ${linkHtml}
    </article>
  `;
}

function kpiTone({ value, target }) {
  if (Number(value) === 0) {
    return 'neutral';
  }

  if (Number(target) <= 0) {
    return 'watch';
  }

  const ratio = Number(value) / Number(target);
  if (ratio >= 1) {
    return 'good';
  }

  return 'watch';
}

function renderKpiCards(data) {
  const cards = [
    {
      key: 'walc',
      label: 'WALC',
      value: formatNumber(data.walc),
      rawValue: data.walc,
      target: formatNumber(KPI_TARGETS.walc),
      rawTarget: KPI_TARGETS.walc,
    },
    {
      key: 'activation_rate_24h',
      label: 'Activation (24h)',
      value: formatPercent(data.activation_rate_24h),
      rawValue: data.activation_rate_24h,
      target: formatPercent(KPI_TARGETS.activation_rate_24h),
      rawTarget: KPI_TARGETS.activation_rate_24h,
    },
    {
      key: 'd7_retention',
      label: 'D7 Retention',
      value: formatPercent(data.d7_retention),
      rawValue: data.d7_retention,
      target: formatPercent(KPI_TARGETS.d7_retention),
      rawTarget: KPI_TARGETS.d7_retention,
    },
    {
      key: 'avg_learning_score_improvement',
      label: 'Learning Gain',
      value: `${formatNumber(data.avg_learning_score_improvement)}점`,
      rawValue: data.avg_learning_score_improvement,
      target: `${formatNumber(KPI_TARGETS.avg_learning_score_improvement)}점`,
      rawTarget: KPI_TARGETS.avg_learning_score_improvement,
    },
    {
      key: 'arpdau_krw',
      label: 'ARPDAU KRW',
      value: `${formatNumber(data.arpdau_krw)}원`,
      rawValue: data.arpdau_krw,
      target: `${formatNumber(KPI_TARGETS.arpdau_krw)}원`,
      rawTarget: KPI_TARGETS.arpdau_krw,
    },
    {
      key: 'arpdau_usd',
      label: 'ARPDAU USD',
      value: `$${formatNumber(data.arpdau_usd)}`,
      rawValue: data.arpdau_usd,
      target: `$${formatNumber(KPI_TARGETS.arpdau_usd)}`,
      rawTarget: KPI_TARGETS.arpdau_usd,
    },
  ];

  elements.kpiCards.innerHTML = cards
    .map((card) => {
      const tone = kpiTone({ value: card.rawValue, target: card.rawTarget });
      return `
        <article class="kpi-card tone-${tone}">
          <p class="kpi-label">${sanitize(card.label)}</p>
          <p class="kpi-value">${sanitize(card.value)}</p>
          <p class="kpi-target">목표: ${sanitize(card.target)}</p>
        </article>
      `;
    })
    .join('');
}

function buildAdvantageChecks() {
  const firstValueMinutes = getFirstValueMinutes();
  const firstSessionStatus =
    firstValueMinutes == null ? 'neutral' : firstValueMinutes <= 5 ? 'good' : 'watch';

  const firstSessionDetail =
    firstValueMinutes == null
      ? '아직 측정 전입니다. 가입 후 첫 미션 완료 시 자동 집계됩니다.'
      : `첫 가치 도달 시간 ${firstValueMinutes.toFixed(1)}분 (목표 5분 이내)`;

  const taskSuccessRate = state.attemptCount === 0 ? null : state.correctAttempts / state.attemptCount;
  const taskStatus =
    taskSuccessRate == null ? 'neutral' : taskSuccessRate >= 0.75 ? 'good' : taskSuccessRate >= 0.5 ? 'watch' : 'risk';

  const missionCompletionRate =
    state.lessons.length === 0 ? null : state.completedLessonIds.size / state.lessons.length;
  const missionStatus =
    missionCompletionRate == null
      ? 'neutral'
      : missionCompletionRate >= 0.35
        ? 'good'
        : missionCompletionRate >= 0.2
          ? 'watch'
          : 'risk';

  const feedbackStatus = state.attemptCount > 0 ? 'good' : 'neutral';

  const reliabilityStatus =
    state.latestOps?.status === 'healthy'
      ? 'good'
      : state.latestOps?.status === 'warning'
        ? 'watch'
        : state.latestOps?.status
          ? 'risk'
          : 'neutral';

  return [
    {
      title: '첫 가치 도달 속도',
      benchmark: '5분 이내',
      status: firstSessionStatus,
      detail: firstSessionDetail,
      weight: 20,
    },
    {
      title: '첫 세션 과업 성공률',
      benchmark: '75% 이상',
      status: taskStatus,
      detail:
        taskSuccessRate == null
          ? '아직 실습 전입니다.'
          : `현재 정답률 ${Math.round(taskSuccessRate * 100)}%`,
      weight: 20,
    },
    {
      title: '미션 진행 동기 루프',
      benchmark: '완료율 20%+',
      status: missionStatus,
      detail:
        missionCompletionRate == null
          ? '미션을 불러오는 중입니다.'
          : `완료율 ${Math.round(missionCompletionRate * 100)}%`,
      weight: 15,
    },
    {
      title: '피드백 즉시성',
      benchmark: '제출 즉시 피드백',
      status: feedbackStatus,
      detail:
        state.attemptCount > 0
          ? '점수/피드백/숙련도 갱신이 즉시 제공됩니다.'
          : '첫 실습 제출 후 즉시 피드백 루프가 활성화됩니다.',
      weight: 15,
    },
    {
      title: '운영 신뢰성',
      benchmark: 'CI/CD Health',
      status: reliabilityStatus,
      detail:
        state.latestOps == null
          ? '운영 데이터를 불러오는 중입니다.'
          : `현재 운영 상태: ${state.latestOps.status}`,
      weight: 15,
    },
    {
      title: '가독성/모바일 대응',
      benchmark: '작은 화면 기준',
      status: 'good',
      detail: '모바일 1열 우선 레이아웃과 44px 이상 터치 타깃을 적용했습니다.',
      weight: 15,
    },
  ];
}

function scoreByStatus(status) {
  if (status === 'good') {
    return 1;
  }

  if (status === 'watch') {
    return 0.6;
  }

  if (status === 'risk') {
    return 0.25;
  }

  return 0.45;
}

function statusToTone(status) {
  if (status === 'good') {
    return 'ok';
  }

  if (status === 'watch') {
    return 'warning';
  }

  if (status === 'risk') {
    return 'danger';
  }

  return 'neutral';
}

function renderAdvantageBoard() {
  const checks = buildAdvantageChecks();

  const weightedTotal = checks.reduce((sum, item) => sum + item.weight, 0);
  const weightedScore = checks.reduce(
    (sum, item) => sum + item.weight * scoreByStatus(item.status),
    0,
  );
  const score = weightedTotal === 0 ? 0 : Math.round((weightedScore / weightedTotal) * 100);

  elements.advantageCards.innerHTML = checks
    .map((item) => {
      const tone = statusToTone(item.status);
      return `
        <article class="advantage-card ${sanitize(item.status)}">
          <div class="panel-head">
            <h4>${sanitize(item.title)}</h4>
            <span class="status-chip ${tone}">${sanitize(item.benchmark)}</span>
          </div>
          <p>${sanitize(item.detail)}</p>
        </article>
      `;
    })
    .join('');

  elements.designScore.textContent = `점수 ${score} / 100`;
  setToneClass(elements.designScore, score >= 80 ? 'ok' : score >= 60 ? 'warning' : 'danger');
}

async function loadLessons() {
  const language = state.country === 'KR' ? 'ko' : 'en';
  const data = await api(`/v1/lessons?language=${language}`);
  state.lessons = data.lessons;
  renderLessons();
  renderAdvantageBoard();
}

async function loadKpis() {
  const data = await api('/v1/kpis');
  renderKpiCards(data);
}

async function loadOpsStatus() {
  const data = await api('/v1/ops/status');
  const ops = data.ops;
  state.latestOps = ops;

  const github = ops.github ?? {};
  const vercel = ops.vercel ?? {};
  const ci = github.latest_ci ?? null;
  const phase = github.phase_progress ?? [];
  const phaseSummary = phase
    .map((item) => `${item.phase.replace('phase/', 'P')}:${Math.round(item.completion * 100)}%`)
    .join(' / ');
  const latestDeployment = vercel.latest_deployment ?? null;

  const cards = [
    renderOpsCard({
      title: '전체 운영 상태',
      state: ops.status ?? 'unknown',
      body: `마지막 갱신: ${new Date(data.generated_at).toLocaleString()}`,
    }),
    renderOpsCard({
      title: 'GitHub CI',
      state: ci?.state ?? github.status ?? 'not_configured',
      body: ci
        ? `${ci.name} #${ci.run_number} | branch: ${ci.branch}`
        : github.setup_hint ?? 'GitHub 연결 전',
      link: ci?.url ?? null,
    }),
    renderOpsCard({
      title: 'GitHub 이슈/PR',
      state: github.status ?? 'not_configured',
      body:
        github.configured === false
          ? github.setup_hint ?? '설정 필요'
          : `PR ${github.open_pull_requests}개 / 이슈 ${github.open_issues}개 / Blocker ${github.blocker_issues}개`,
    }),
    renderOpsCard({
      title: '로드맵 Phase',
      state: github.status ?? 'unknown',
      body: phaseSummary || 'phase 라벨(phase/0..3) 이슈가 아직 없습니다.',
    }),
    renderOpsCard({
      title: 'Vercel 배포',
      state: latestDeployment?.state ?? vercel.status ?? 'not_configured',
      body: latestDeployment
        ? `${latestDeployment.target} 배포 | 성공률 ${Math.round((vercel.recent_success_rate ?? 0) * 100)}%`
        : vercel.setup_hint ?? 'Vercel 연결 전',
      link: latestDeployment?.url ?? null,
    }),
  ];

  elements.opsCards.innerHTML = cards.join('');

  if (ops.status === 'healthy') {
    setResult(elements.opsResult, 'GitHub + Vercel 상태가 정상입니다.');
  } else if (ops.status === 'warning') {
    setWarning(elements.opsResult, '일부 연동 설정이 비어 있습니다. 환경변수를 점검하세요.');
  } else {
    setResult(elements.opsResult, '외부 연동 호출 중 오류가 발생했습니다. 토큰/리포 정보를 확인하세요.', true);
  }

  renderAdvantageBoard();
}

elements.signupForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const birthYear = Number(document.querySelector('#birth-year').value);
    const country = document.querySelector('#country').value;
    const guardianContact = document.querySelector('#guardian-contact').value || null;
    state.country = country;

    const data = await api('/v1/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        birth_year: birthYear,
        country,
        guardian_contact: guardianContact,
      }),
    });

    state.userId = data.user_id;
    state.sessionStartedAt = Date.now();
    state.firstMissionCompletedAt = null;
    state.completedLessonIds = new Set();
    state.attemptCount = 0;
    state.correctAttempts = 0;

    setResult(
      elements.signupResult,
      `가입 완료: ${data.user_id} (연령대: ${data.age_band}, 광고개인화동의: ${data.consent_state.ad_personalization})`,
    );

    await api('/v1/events', {
      method: 'POST',
      body: JSON.stringify({
        event_name: 'session_started',
        user_id: state.userId,
        session_id: state.sessionId,
        props: { country: state.country },
      }),
    });

    await loadLessons();
    await loadKpis();
    updateJourneyPanel();
    renderAdvantageBoard();
  } catch (error) {
    setResult(elements.signupResult, error.message, true);
  }
});

elements.refreshLessons.addEventListener('click', async () => {
  try {
    await loadLessons();
  } catch (error) {
    setResult(elements.signupResult, error.message, true);
  }
});

elements.grantConsent.addEventListener('click', async () => {
  if (!state.userId) {
    setResult(elements.adsResult, '먼저 계정을 생성해주세요.', true);
    return;
  }

  try {
    await api('/v1/consent/guardian', {
      method: 'POST',
      body: JSON.stringify({
        user_id: state.userId,
        consent_type: 'ad_personalization',
        proof_token: `proof-${Date.now()}`,
      }),
    });
    setResult(elements.adsResult, '보호자 동의가 반영되었습니다.');
  } catch (error) {
    setResult(elements.adsResult, error.message, true);
  }
});

elements.checkAdMode.addEventListener('click', async () => {
  if (!state.userId) {
    setResult(elements.adsResult, '먼저 계정을 생성해주세요.', true);
    return;
  }

  try {
    const result = await api(
      `/v1/ads/decision?user_id=${state.userId}&country=${state.country}&placement=lesson_feed`,
    );
    setResult(
      elements.adsResult,
      `광고 모드: ${result.ad_mode} (사유: ${result.reason_code}, 규칙: ${result.policy_rule_id})`,
    );
  } catch (error) {
    setResult(elements.adsResult, error.message, true);
  }
});

elements.refreshKpi.addEventListener('click', async () => {
  try {
    await loadKpis();
  } catch (error) {
    setResult(elements.adsResult, error.message, true);
  }
});

async function handleRefreshOps() {
  try {
    await loadOpsStatus();
  } catch (error) {
    setResult(elements.opsResult, error.message, true);
    renderAdvantageBoard();
  }
}

elements.refreshOps.addEventListener('click', handleRefreshOps);
elements.refreshOpsHero.addEventListener('click', handleRefreshOps);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker is optional in local dev.
  });
}

renderSimulationPlaceholder();
setNeutral(elements.signupResult, '아직 가입 전입니다.');
setNeutral(elements.adsResult, '아직 확인하지 않았습니다.');
updateJourneyPanel();
renderAdvantageBoard();

void loadLessons().catch(() => {});
void loadKpis().catch(() => {});
void loadOpsStatus().catch(() => {});
