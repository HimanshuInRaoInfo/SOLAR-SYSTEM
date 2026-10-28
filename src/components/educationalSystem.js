import { CLASSROOM_LESSONS, STUDENT_QUIZ } from '../milkyWayData.js';

/**
 * Educational & Classroom Learning Manager
 * Provides structured astronomy lessons, interactive quizzes, and
 * cosmic powers-of-ten scale comparisons for students.
 */
export class EducationalSystem {
  constructor(cameraController, uiManager) {
    this.cameraController = cameraController;
    this.uiManager = uiManager;

    this.currentLessonIndex = 0;
    this.quizScore = 0;
    this.userAnswers = {};

    this.createDom();
    this.attachEvents();
  }

  createDom() {
    // 1. Lessons Drawer (Left-Center)
    const lessonsDrawer = document.createElement('div');
    lessonsDrawer.className = 'edu-panel lessons-drawer hidden';
    lessonsDrawer.id = 'lessonsDrawer';
    lessonsDrawer.innerHTML = `
      <div class="edu-header">
        <div class="edu-badge">CLASSROOM LESSON PLAN</div>
        <button class="close-edu-btn" id="closeLessonsBtn">&times;</button>
      </div>
      <div class="lesson-stepper" id="lessonStepper"></div>
      <div class="lesson-content">
        <h2 class="lesson-title" id="lessonTitle"></h2>
        <div class="lesson-sub" id="lessonSub"></div>
        <p class="lesson-summary" id="lessonSummary"></p>
        <div class="lesson-bullets-box">
          <h4>KEY LEARNING TAKEAWAYS:</h4>
          <ul id="lessonKeyPoints" class="lesson-keypoints"></ul>
        </div>
      </div>
      <div class="lesson-nav-footer">
        <button class="edu-btn" id="btnPrevLesson">◀ Previous</button>
        <button class="edu-btn primary" id="btnFlyLesson">Fly to Lesson 🚀</button>
        <button class="edu-btn" id="btnNextLesson">Next ▶</button>
      </div>
    `;
    document.body.appendChild(lessonsDrawer);
    this.lessonsDrawer = lessonsDrawer;

    // 2. Interactive Student Quiz Modal
    const quizModal = document.createElement('div');
    quizModal.className = 'edu-modal quiz-modal hidden';
    quizModal.id = 'quizModal';
    quizModal.innerHTML = `
      <div class="quiz-container">
        <div class="edu-header">
          <div class="edu-badge">STUDENT KNOWLEDGE CHECK // ASTRONOMY QUIZ</div>
          <button class="close-edu-btn" id="closeQuizBtn">&times;</button>
        </div>
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" id="quizProgressFill" style="width: 20%;"></div>
        </div>
        <div class="quiz-card" id="quizCard">
          <div class="quiz-qnum" id="quizQNum">QUESTION 1 OF 5</div>
          <h3 class="quiz-question" id="quizQuestion"></h3>
          <div class="quiz-options" id="quizOptions"></div>
          <div class="quiz-feedback hidden" id="quizFeedback"></div>
        </div>
        <div class="quiz-footer">
          <button class="edu-btn secondary" id="btnQuizShow3D">Inspect in 3D 🔭</button>
          <button class="edu-btn primary" id="btnQuizNext" disabled>Next Question ▶</button>
        </div>
      </div>
    `;
    document.body.appendChild(quizModal);
    this.quizModal = quizModal;

    // 3. Cosmic Scale Comparison Bar (Powers of Ten)
    const scaleBar = document.createElement('div');
    scaleBar.className = 'cosmic-scale-bar hidden';
    scaleBar.id = 'cosmicScaleBar';
    scaleBar.innerHTML = `
      <div class="scale-header">
        <span>POWERS OF TEN // COSMIC SCALE EXPLORER</span>
        <button class="scale-close" id="closeScaleBtn">&times;</button>
      </div>
      <div class="scale-ruler">
        <button class="scale-step active" data-scale="satellites">10² m<br><span>ISS</span></button>
        <button class="scale-step" data-scale="earth">10⁷ m<br><span>Earth</span></button>
        <button class="scale-step" data-scale="sun">10⁹ m<br><span>The Sun</span></button>
        <button class="scale-step" data-scale="solar_system">10¹³ m<br><span>Solar System</span></button>
        <button class="scale-step" data-scale="voyager">10¹⁴ m<br><span>Voyager 1</span></button>
        <button class="scale-step" data-scale="orion_spur">10¹⁹ m<br><span>Orion Spur</span></button>
        <button class="scale-step" data-scale="milky_way">10²¹ m<br><span>Milky Way</span></button>
      </div>
      <div class="scale-desc" id="scaleDesc">
        <strong>10² meters (100 m):</strong> The International Space Station spans 109 meters—about the length of a full football stadium, orbiting 420 km above Earth.
      </div>
    `;
    document.body.appendChild(scaleBar);
    this.scaleBar = scaleBar;

    this.renderLesson(0);
  }

  attachEvents() {
    // Lessons drawer buttons
    document.getElementById('closeLessonsBtn').addEventListener('click', () => {
      this.lessonsDrawer.classList.add('hidden');
    });

    document.getElementById('btnPrevLesson').addEventListener('click', () => {
      if (this.currentLessonIndex > 0) {
        this.renderLesson(this.currentLessonIndex - 1);
      }
    });

    document.getElementById('btnNextLesson').addEventListener('click', () => {
      if (this.currentLessonIndex < CLASSROOM_LESSONS.length - 1) {
        this.renderLesson(this.currentLessonIndex + 1);
      }
    });

    document.getElementById('btnFlyLesson').addEventListener('click', () => {
      const lesson = CLASSROOM_LESSONS[this.currentLessonIndex];
      if (lesson) {
        this.cameraController.flyToTarget(lesson.target, lesson.cameraTarget);
      }
    });

    // Quiz events
    document.getElementById('closeQuizBtn').addEventListener('click', () => {
      this.quizModal.classList.add('hidden');
    });

    document.getElementById('btnQuizShow3D').addEventListener('click', () => {
      const q = STUDENT_QUIZ[this.currentQuizIndex || 0];
      if (q && q.focusId) {
        this.cameraController.flyToTarget(q.focusId);
      }
    });

    document.getElementById('btnQuizNext').addEventListener('click', () => {
      this.currentQuizIndex++;
      if (this.currentQuizIndex < STUDENT_QUIZ.length) {
        this.renderQuizQuestion(this.currentQuizIndex);
      } else {
        this.renderQuizResults();
      }
    });

    // Scale comparison events
    document.getElementById('closeScaleBtn').addEventListener('click', () => {
      this.scaleBar.classList.add('hidden');
    });

    this.scaleBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.scale-step');
      if (!btn) return;
      this.scaleBar.querySelectorAll('.scale-step').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      this.handleScaleSelect(btn.dataset.scale);
    });
  }

  renderLesson(idx) {
    this.currentLessonIndex = idx;
    const lesson = CLASSROOM_LESSONS[idx];
    if (!lesson) return;

    // Update stepper
    const stepper = document.getElementById('lessonStepper');
    stepper.innerHTML = CLASSROOM_LESSONS.map((l, i) => `
      <div class="step-dot ${i === idx ? 'active' : ''} ${i < idx ? 'completed' : ''}" data-idx="${i}">
        ${i + 1}
      </div>
    `).join('');

    stepper.querySelectorAll('.step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        this.renderLesson(parseInt(dot.dataset.idx, 10));
      });
    });

    document.getElementById('lessonTitle').textContent = lesson.title;
    document.getElementById('lessonSub').textContent = lesson.subtitle;
    document.getElementById('lessonSummary').textContent = lesson.summary;

    const pointsList = document.getElementById('lessonKeyPoints');
    pointsList.innerHTML = lesson.keyPoints.map(pt => `<li>${pt}</li>`).join('');

    document.getElementById('btnPrevLesson').disabled = idx === 0;
    document.getElementById('btnNextLesson').disabled = idx === CLASSROOM_LESSONS.length - 1;

    // Trigger camera fly-to automatically when switching lessons
    this.cameraController.flyToTarget(lesson.target, lesson.cameraTarget);
  }

  openLessons() {
    this.lessonsDrawer.classList.remove('hidden');
    this.renderLesson(this.currentLessonIndex);
  }

  openQuiz() {
    this.quizModal.classList.remove('hidden');
    this.currentQuizIndex = 0;
    this.quizScore = 0;
    this.renderQuizQuestion(0);
  }

  renderQuizQuestion(idx) {
    const q = STUDENT_QUIZ[idx];
    if (!q) return;

    document.getElementById('quizQNum').textContent = `QUESTION ${idx + 1} OF ${STUDENT_QUIZ.length}`;
    document.getElementById('quizQuestion').textContent = q.question;
    document.getElementById('quizProgressFill').style.width = `${((idx + 1) / STUDENT_QUIZ.length) * 100}%`;

    const feedback = document.getElementById('quizFeedback');
    feedback.className = 'quiz-feedback hidden';
    feedback.innerHTML = '';

    const nextBtn = document.getElementById('btnQuizNext');
    nextBtn.disabled = true;

    const optionsContainer = document.getElementById('quizOptions');
    optionsContainer.innerHTML = q.options.map((opt, oIdx) => `
      <button class="quiz-opt-btn" data-idx="${oIdx}">
        <span class="opt-letter">${String.fromCharCode(65 + oIdx)}</span>
        <span>${opt}</span>
      </button>
    `).join('');

    optionsContainer.querySelectorAll('.quiz-opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const selected = parseInt(btn.dataset.idx, 10);
        this.handleQuizAnswer(selected, q);
      });
    });
  }

  handleQuizAnswer(selectedIdx, q) {
    const optionsContainer = document.getElementById('quizOptions');
    const buttons = optionsContainer.querySelectorAll('.quiz-opt-btn');
    buttons.forEach((b, i) => {
      b.disabled = true;
      if (i === q.correctIndex) {
        b.classList.add('correct');
      } else if (i === selectedIdx) {
        b.classList.add('wrong');
      }
    });

    const isCorrect = selectedIdx === q.correctIndex;
    if (isCorrect) this.quizScore++;

    const feedback = document.getElementById('quizFeedback');
    feedback.className = `quiz-feedback ${isCorrect ? 'correct' : 'wrong'}`;
    feedback.innerHTML = `
      <strong>${isCorrect ? '🌟 Excellent! Correct!' : '❌ Not quite!'}</strong>
      <p>${q.explanation}</p>
    `;

    document.getElementById('btnQuizNext').disabled = false;
  }

  renderQuizResults() {
    const card = document.getElementById('quizCard');
    const pct = Math.round((this.quizScore / STUDENT_QUIZ.length) * 100);
    card.innerHTML = `
      <div style="text-align: center; padding: 24px 0;">
        <div style="font-size: 54px; margin-bottom: 12px;">${pct >= 80 ? '🎓 🌟' : '🚀 🪐'}</div>
        <h2 style="font-size: 26px; color: #ffffff;">Quiz Completed!</h2>
        <div style="font-size: 40px; font-weight: 700; color: #38ef7d; margin: 12px 0;">${this.quizScore} / ${STUDENT_QUIZ.length} (${pct}%)</div>
        <p style="color: #a0aec0; font-size: 14px; max-width: 440px; margin: 0 auto;">
          ${pct >= 80 
            ? 'Outstanding work! You have mastered the architecture of the Milky Way, our Solar System, and humanity\'s space missions!' 
            : 'Great effort! Re-visit the Classroom Lessons and explore the 3D landmarks to review the cosmic concepts.'}
        </p>
      </div>
    `;

    document.getElementById('btnQuizNext').style.display = 'none';
  }

  openScaleBar() {
    this.scaleBar.classList.remove('hidden');
  }

  handleScaleSelect(scaleKey) {
    const desc = document.getElementById('scaleDesc');
    const scaleDescriptions = {
      satellites: '<strong>10² meters (100 m):</strong> The International Space Station spans 109 meters—about the length of a full football stadium, orbiting 420 km above Earth.',
      earth: '<strong>10⁷ meters (12,742 km):</strong> Earth diameter. Home to 8 billion humans and the entire biosphere.',
      sun: '<strong>10⁹ meters (1,392,700 km):</strong> The Sun\'s diameter. More than 1.3 million Earths would fit inside.',
      solar_system: '<strong>10¹³ meters (~100 AU):</strong> The planetary solar system out to the Kuiper Belt.',
      voyager: '<strong>10¹⁴ meters (~163 AU / 24 Billion km):</strong> Voyager 1 in interstellar space, the farthest human artifact.',
      orion_spur: '<strong>10¹⁹ meters (~3,500 light-years):</strong> The Orion-Cygnus Arm spur containing our Sun, Orion Nebula, and Pleiades.',
      milky_way: '<strong>10²¹ meters (100,000 light-years):</strong> The entire barred spiral Milky Way Galaxy containing 400 billion stars!'
    };

    desc.innerHTML = scaleDescriptions[scaleKey] || '';

    // Smoothly fly to the corresponding scale!
    if (scaleKey === 'satellites') {
      this.cameraController.flyToTarget('satellite_iss');
    } else if (scaleKey === 'earth') {
      this.cameraController.flyToTarget('earth');
    } else if (scaleKey === 'sun') {
      this.cameraController.flyToTarget('sun');
    } else if (scaleKey === 'solar_system') {
      this.cameraController.flyToTarget('overview');
    } else if (scaleKey === 'voyager') {
      this.cameraController.flyToTarget('satellite_voyager1');
    } else if (scaleKey === 'orion_spur') {
      this.cameraController.flyToTarget('arm_orion_spur');
    } else if (scaleKey === 'milky_way') {
      this.cameraController.flyToTarget('milky_way');
    }
  }
}

