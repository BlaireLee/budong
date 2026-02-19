const defaultApiBase =
  window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
const API_BASE = (window.localStorage.getItem('api_base') || defaultApiBase).replace(/\/$/, '');

const state = {
  userId: null,
  country: 'KR',
  sessionId: `session_${Date.now()}`,
  lessons: [],
  selectedLesson: null,
  selectedLessonDetail: null,
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
  opsCards: document.querySelector('#ops-cards'),
  opsResult: document.querySelector('#ops-result'),
};

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

function setResult(element, text, isError = false) {
  element.textContent = text;
  element.classList.toggle('danger', isError);
  element.classList.toggle('ok', !isError);
  element.classList.remove('warning');
}

function setWarning(element, text) {
  element.textContent = text;
  element.classList.remove('danger', 'ok');
  element.classList.add('warning');
}

async function loadLessons() {
  const language = state.country === 'KR' ? 'ko' : 'en';
  const data = await api(`/v1/lessons?language=${language}`);
  state.lessons = data.lessons;
  renderLessons();
}

function renderLessons() {
  if (state.lessons.length === 0) {
    elements.lessons.innerHTML = '<p>현재 선택된 언어의 미션이 없습니다.</p>';
    return;
  }

  elements.lessons.innerHTML = state.lessons
    .map(
      (lesson) => `
        <article class="lesson-card" role="listitem">
          <div class="chips">
            <span class="chip">${lesson.language.toUpperCase()}</span>
            <span class="chip">${lesson.difficulty}</span>
            <span class="chip">${lesson.estimated_minutes}분</span>
          </div>
          <h3>${lesson.topic}</h3>
          <p>버전: ${lesson.version}</p>
          <button data-lesson-id="${lesson.lesson_id}" class="start-lesson">이 미션 시작</button>
        </article>
      `,
    )
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
}

function renderSimulationCard() {
  if (!state.selectedLesson || !state.selectedLessonDetail) {
    return;
  }

  const optionsHtml = state.selectedLessonDetail.options
    .map(
      (option, index) => `
      <label>
        <input type="radio" name="option" value="${index}" ${index === 0 ? 'checked' : ''} />
        <span>${option}</span>
      </label>
    `,
    )
    .join('');

  elements.simulationCard.innerHTML = `
    <h3>${state.selectedLesson.topic}</h3>
    <p>${state.selectedLessonDetail.scenario}</p>
    <p><strong>문항 ID:</strong> ${state.selectedLesson.lesson_id}</p>
    <form id="simulation-form">
      <div class="options">
        ${optionsHtml}
      </div>
      <label>
        선택 이유
        <textarea id="rationale-text" rows="2" placeholder="왜 이렇게 골랐는지 적어보세요."></textarea>
      </label>
      <button type="submit">제출하고 피드백 받기</button>
    </form>
    <p id="simulation-result" class="result"></p>
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
      await loadKpis();
    } catch (error) {
      setResult(result, error.message, true);
    }
  });
}

async function loadKpis() {
  const data = await api('/v1/kpis');
  const cards = [
    ['WALC', data.walc],
    ['Activation(24h)', `${Math.round(data.activation_rate_24h * 100)}%`],
    ['D7 Retention', `${Math.round(data.d7_retention * 100)}%`],
    ['Learning Gain', data.avg_learning_score_improvement],
    ['ARPDAU KRW', data.arpdau_krw],
    ['ARPDAU USD', data.arpdau_usd],
  ];

  elements.kpiCards.innerHTML = cards
    .map(
      ([label, value]) => `
      <article class="kpi-card">
        <p class="kpi-label">${label}</p>
        <p class="kpi-value">${value}</p>
      </article>
    `,
    )
    .join('');
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

function renderOpsCard({ title, state, body, link }) {
  const tone = toneByState(state);
  const linkHtml = link ? `<a href="${link}" target="_blank" rel="noreferrer">자세히 보기</a>` : '';
  return `
    <article class="ops-card">
      <p class="ops-title">${title}</p>
      <span class="status-pill ${tone}">${state}</span>
      <p class="ops-body">${body}</p>
      ${linkHtml}
    </article>
  `;
}

async function loadOpsStatus() {
  const data = await api('/v1/ops/status');
  const ops = data.ops;
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
      title: 'GitHub 진행률',
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
        ? `${latestDeployment.target} 배포 | 성공률 ${(vercel.recent_success_rate ?? 0) * 100}%`
        : vercel.setup_hint ?? 'Vercel 연결 전',
      link: latestDeployment?.url ?? null,
    }),
  ];

  elements.opsCards.innerHTML = cards.join('');

  if (ops.status === 'healthy') {
    setResult(elements.opsResult, 'GitHub + Vercel 상태가 정상입니다.');
  } else if (ops.status === 'warning') {
    setWarning(elements.opsResult, '일부 연동 설정이 비어 있습니다. 가이드를 따라 환경변수를 설정하세요.');
  } else {
    setResult(elements.opsResult, '외부 연동 호출 중 오류가 발생했습니다. 토큰/리포 정보를 확인하세요.', true);
  }
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

elements.refreshOps.addEventListener('click', async () => {
  try {
    await loadOpsStatus();
  } catch (error) {
    setResult(elements.opsResult, error.message, true);
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker is optional in local dev.
  });
}

void loadLessons().catch(() => {});
void loadKpis().catch(() => {});
void loadOpsStatus().catch(() => {});
