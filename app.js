// ========== THEME TOGGLE ==========
function initTheme() {
  const saved = localStorage.getItem('tka-theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  if (current === 'dark') {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('tka-theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('tka-theme', 'dark');
  }
  updateThemeIcon();
}

function updateThemeIcon() {
  const btn = document.querySelector('.btn-theme');
  if (!btn) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  btn.textContent = isDark ? '☀️' : '🌙';
}

// ========== HAMBURGER MENU ==========
function initHamburger() {
  const hamburger = document.querySelector('.hamburger');
  const links = document.querySelector('.navbar-links');
  if (!hamburger || !links) return;

  hamburger.addEventListener('click', () => {
    links.classList.toggle('show');
  });

  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !links.contains(e.target)) {
      links.classList.remove('show');
    }
  });
}

// ========== SCROLL TO TOP ==========
function initScrollTop() {
  const btn = document.querySelector('.scroll-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      btn.classList.add('show');
    } else {
      btn.classList.remove('show');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ========== TABS ==========
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.closest('.tabs-wrapper') || btn.parentElement.parentElement;
      const target = btn.dataset.tab;

      tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      tabGroup.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const content = tabGroup.querySelector(`#${target}`) || document.getElementById(target);
      if (content) content.classList.add('active');
    });
  });
}

// ========== QUIZ ENGINE ==========
class QuizEngine {
  constructor(containerId, questions, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;
    this.questions = questions;
    this.answers = {};
    this.submitted = false;
    this.timeLimit = options.timeLimit || 0; // in seconds, 0 = no limit
    this.timer = null;
    this.timeLeft = this.timeLimit;
    this.render();
    if (this.timeLimit > 0) this.startTimer();
  }

  render() {
    let html = `
      <div class="quiz-header">
        <div class="quiz-progress">
          <div class="progress-bar"><div class="progress-fill" id="progress-${this.container.id}" style="width:0%"></div></div>
          <span class="progress-text" id="progress-text-${this.container.id}">0/${this.questions.length}</span>
        </div>
        ${this.timeLimit > 0 ? `<div class="timer" id="timer-${this.container.id}">⏱️ ${this.formatTime(this.timeLeft)}</div>` : ''}
      </div>
      <div id="questions-${this.container.id}">
    `;

    this.questions.forEach((q, i) => {
      html += `
        <div class="question-card" id="q-${this.container.id}-${i}">
          <div class="question-number">${i + 1}</div>
          <div class="question-text">${q.question}</div>
          <ul class="options-list">
      `;
      q.options.forEach((opt, j) => {
        const letter = String.fromCharCode(65 + j);
        html += `
          <li class="option-item">
            <label class="option-label" id="opt-${this.container.id}-${i}-${j}">
              <input type="radio" name="q-${this.container.id}-${i}" value="${j}" 
                onchange="quizEngines['${this.container.id}'].selectAnswer(${i}, ${j})">
              <span class="option-marker">${letter}</span>
              <span class="option-text">${opt}</span>
            </label>
          </li>
        `;
      });
      html += `
          </ul>
          <div class="explanation" id="exp-${this.container.id}-${i}">
            <div class="explanation-title">💡 Pembahasan:</div>
            <div>${q.explanation}</div>
          </div>
        </div>
      `;
    });

    html += `
      </div>
      <div style="text-align:center; margin-top:24px;">
        <button class="btn btn-primary" id="submit-${this.container.id}" onclick="quizEngines['${this.container.id}'].submit()">
          📝 Kumpulkan Jawaban
        </button>
        <button class="btn btn-secondary" id="retry-${this.container.id}" onclick="quizEngines['${this.container.id}'].retry()" style="display:none;">
          🔄 Coba Lagi
        </button>
      </div>
      <div class="quiz-result content-card" id="result-${this.container.id}"></div>
    `;

    this.container.innerHTML = html;
  }

  selectAnswer(qIndex, optIndex) {
    if (this.submitted) return;
    this.answers[qIndex] = optIndex;
    this.updateProgress();
  }

  updateProgress() {
    const answered = Object.keys(this.answers).length;
    const total = this.questions.length;
    const pct = (answered / total) * 100;
    const fill = document.getElementById(`progress-${this.container.id}`);
    const text = document.getElementById(`progress-text-${this.container.id}`);
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${answered}/${total}`;
  }

  startTimer() {
    this.timer = setInterval(() => {
      this.timeLeft--;
      const timerEl = document.getElementById(`timer-${this.container.id}`);
      if (timerEl) timerEl.innerHTML = `⏱️ ${this.formatTime(this.timeLeft)}`;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.submit();
      }
    }, 1000);
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  submit() {
    if (this.submitted) return;
    this.submitted = true;
    if (this.timer) clearInterval(this.timer);

    let correct = 0;
    this.questions.forEach((q, i) => {
      const selected = this.answers[i];
      const options = document.querySelectorAll(`[id^="opt-${this.container.id}-${i}-"]`);

      // Show correct
      if (options[q.answer]) {
        options[q.answer].classList.add('correct');
      }

      // Check user answer
      if (selected !== undefined) {
        if (selected === q.answer) {
          correct++;
        } else {
          options[selected].classList.add('wrong');
        }
      }

      // Disable all radios
      const radios = document.querySelectorAll(`input[name="q-${this.container.id}-${i}"]`);
      radios.forEach(r => r.disabled = true);

      // Show explanation
      const exp = document.getElementById(`exp-${this.container.id}-${i}`);
      if (exp) exp.classList.add('show');
    });

    // Show results
    const total = this.questions.length;
    const pct = Math.round((correct / total) * 100);
    let grade, cls;
    if (pct >= 80) { grade = '🎉 Luar Biasa!'; cls = 'excellent'; }
    else if (pct >= 60) { grade = '👍 Bagus!'; cls = 'good'; }
    else if (pct >= 40) { grade = '📚 Perlu Belajar Lagi'; cls = 'average'; }
    else { grade = '💪 Jangan Menyerah!'; cls = 'poor'; }

    const resultDiv = document.getElementById(`result-${this.container.id}`);
    if (resultDiv) {
      resultDiv.innerHTML = `
        <div class="result-score ${cls}">${pct}%</div>
        <div class="result-label">${grade}</div>
        <div class="result-details">
          <div class="result-stat">
            <div class="result-stat-num" style="color:var(--secondary)">${correct}</div>
            <div class="result-stat-label">Benar</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-num" style="color:var(--danger)">${total - correct}</div>
            <div class="result-stat-label">Salah</div>
          </div>
          <div class="result-stat">
            <div class="result-stat-num" style="color:var(--primary)">${total}</div>
            <div class="result-stat-label">Total Soal</div>
          </div>
        </div>
      `;
      resultDiv.classList.add('show');
    }

    // Hide submit, show retry
    const submitBtn = document.getElementById(`submit-${this.container.id}`);
    const retryBtn = document.getElementById(`retry-${this.container.id}`);
    if (submitBtn) submitBtn.style.display = 'none';
    if (retryBtn) retryBtn.style.display = 'inline-flex';

    // Scroll to result
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  retry() {
    this.answers = {};
    this.submitted = false;
    this.timeLeft = this.timeLimit;
    this.render();
    if (this.timeLimit > 0) this.startTimer();
  }
}

// Global registry
const quizEngines = {};

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initHamburger();
  initScrollTop();
  initTabs();
});
