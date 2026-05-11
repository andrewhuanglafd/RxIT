// === STATE ===
const STORAGE_KEY = 'nremt_drug_progress_v1';
let progress = loadProgress();
let currentDeck = [];
let currentIndex = 0;
let currentQuiz = null;
let drillField = null;
let currentScenarioIdx = 0;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (!p.starred) p.starred = {};
      if (!p.scenarios) p.scenarios = {};
      return p;
    }
  } catch (e) {}
  return {
    drugs: {},
    starred: {},
    scenarios: {},      // id -> 'correct' | 'incorrect'
    totalReviews: 0,
    lastStudyDate: null,
    streak: 0
  };
}

function isStarred(id) { return !!progress.starred[id]; }
function toggleStar(id) {
  if (progress.starred[id]) delete progress.starred[id];
  else progress.starred[id] = true;
  saveProgress();
}
function starredCount() { return Object.keys(progress.starred).length; }
function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}
function getDrugProgress(id) {
  if (!progress.drugs[id]) {
    progress.drugs[id] = { ease: 2.5, interval: 0, dueAt: 0, reviews: 0, correct: 0 };
  }
  return progress.drugs[id];
}
function masteryLevel(id) {
  const p = progress.drugs[id];
  if (!p || p.reviews === 0) return 'new';
  if (p.interval >= 7 && (p.correct / p.reviews) >= 0.8) return 'mastered';
  return 'learning';
}

// === NAVIGATION ===
function goTo(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  document.querySelectorAll('nav.bottom-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewName);
  });
  window.scrollTo(0, 0);

  if (viewName === 'home') renderHome();
  if (viewName === 'browse') renderBrowse();
  if (viewName === 'progress') renderProgressView();
  if (viewName === 'quiz-setup') renderQuizSetup();
  if (viewName === 'drill-setup') renderDrillSetup();
  if (viewName === 'families') renderFamilies();
  if (viewName === 'scenarios') renderScenarios();
}

// === HOME ===
function renderHome() {
  const total = DRUGS.length;
  let mastered = 0, learning = 0, due = 0;
  const now = Date.now();
  DRUGS.forEach(d => {
    const lvl = masteryLevel(d.id);
    if (lvl === 'mastered') mastered++;
    else if (lvl === 'learning') learning++;
    const p = progress.drugs[d.id];
    if (p && p.dueAt && p.dueAt <= now) due++;
  });
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  document.getElementById('overall-percent').textContent = pct + '%';
  document.getElementById('overall-bar').style.width = pct + '%';
  document.getElementById('mastered-count').textContent = mastered;
  document.getElementById('learning-count').textContent = learning;
  document.getElementById('due-count').textContent = due;
  document.getElementById('header-mastered').textContent = mastered;
  document.getElementById('header-total').textContent = total;

  // Starred banner
  const sCount = starredCount();
  const banner = document.getElementById('starred-banner');
  const bText = document.getElementById('starred-text');
  const bBtn = document.getElementById('starred-study-btn');
  if (sCount > 0) {
    banner.classList.add('has-stars');
    bText.classList.remove('empty');
    bText.textContent = `${sCount} card${sCount === 1 ? '' : 's'} starred for focused review`;
    bBtn.style.display = 'block';
  } else {
    banner.classList.remove('has-stars');
    bText.classList.add('empty');
    bText.textContent = 'No cards starred yet. Tap ☆ on any card to flag it.';
    bBtn.style.display = 'none';
  }

  const grid = document.getElementById('category-grid');
  grid.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const drugsInCat = DRUGS.filter(d => d.category === cat);
    const masteredInCat = drugsInCat.filter(d => masteryLevel(d.id) === 'mastered').length;
    const color = CATEGORY_COLORS[cat] || '#64748b';
    const btn = document.createElement('button');
    btn.className = 'category-pill';
    btn.innerHTML = `
      <div class="name"><span class="dot" style="background:${color}"></span>${cat}</div>
      <div class="count">${masteredInCat} / ${drugsInCat.length} mastered</div>
    `;
    btn.onclick = () => startFlashcards('category', cat);
    grid.appendChild(btn);
  });
}

// === FLASHCARDS ===
function buildDeck(mode, filter) {
  const now = Date.now();
  let deck = [...DRUGS];
  if (mode === 'category') {
    deck = deck.filter(d => d.category === filter);
  } else if (mode === 'starred') {
    deck = deck.filter(d => isStarred(d.id));
    if (deck.length === 0) {
      alert('No cards are starred yet. Tap the ☆ on a card to add it.');
      return [];
    }
  } else if (mode === 'weak') {
    deck = deck.filter(d => {
      const lvl = masteryLevel(d.id);
      return lvl === 'new' || lvl === 'learning';
    });
    if (deck.length === 0) deck = [...DRUGS];
  } else if (mode === 'due') {
    deck = deck.filter(d => {
      const p = progress.drugs[d.id];
      return !p || !p.dueAt || p.dueAt <= now;
    });
    if (deck.length === 0) {
      alert('No cards are due right now. Great job! Showing all cards instead.');
      deck = [...DRUGS];
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startFlashcards(mode, filter) {
  drillField = null;
  const deck = buildDeck(mode, filter);
  if (deck.length === 0) return;  // alert already shown
  currentDeck = deck;
  currentIndex = 0;
  goTo('flashcards');
  renderCard();
}

function shuffleDeck() {
  for (let i = currentDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
  }
  currentIndex = 0;
  renderCard();
}

function renderCard() {
  const card = document.getElementById('flashcard');
  card.classList.remove('flipped');
  const ratingBar = document.getElementById('card-rating-bar');
  if (ratingBar) ratingBar.style.display = 'none';

  if (currentDeck.length === 0) {
    document.getElementById('fc-front').innerHTML = '<div class="empty-state"><div class="emoji">🎉</div><h3>No cards in deck</h3><p>Try a different mode</p></div>';
    document.getElementById('fc-back').innerHTML = '';
    document.getElementById('fc-progress').textContent = '0 / 0';
    document.getElementById('card-counter-num').textContent = '0';
    document.getElementById('card-counter-total').textContent = '0';
    return;
  }

  const drug = currentDeck[currentIndex];
  const color = CATEGORY_COLORS[drug.category] || '#64748b';
  const tradeFull = drug.trade !== '—' ? ` <span style="color:var(--text-dim);font-style:italic;font-weight:500;font-size:0.7em">(${drug.trade})</span>` : '';

  if (drillField) {
    document.getElementById('fc-front').innerHTML = `
      <span class="category-tag" style="background:${color}">${drug.category}</span>
      <div class="drill-drug-name">${drug.generic}${tradeFull}</div>
      <div class="drill-question">${FIELD_QUESTIONS[drillField]}</div>
      <div class="tap-hint">👆 Tap to reveal</div>
    `;
    document.getElementById('fc-back').innerHTML = `
      <span class="category-tag" style="background:${color}">${drug.category}</span>
      <div class="drill-drug-name" style="font-size:18px;margin-bottom:18px">${drug.generic}${tradeFull}</div>
      <div class="drill-field-label">${FIELD_LABELS[drillField]}</div>
      <div class="drill-answer">${drug[drillField]}</div>
    `;
  } else {
    document.getElementById('fc-front').innerHTML = `
      <span class="category-tag" style="background:${color}">${drug.category}</span>
      <div class="drug-generic">${drug.generic}</div>
      <div class="drug-trade">${drug.trade !== '—' ? '(' + drug.trade + ')' : ''}</div>
      <div class="tap-hint">Recall: class • action • indications • contraindications • side effects • doses<br><br>👆 Tap to reveal</div>
    `;
    document.getElementById('fc-back').innerHTML = `
      <span class="category-tag" style="background:${color}">${drug.category}</span>
      <div class="drug-name-mini">${drug.generic}${drug.trade !== '—' ? ' (' + drug.trade + ')' : ''}</div>
      <div class="flashcard-row"><div class="label">Class</div><div class="value">${drug.class}</div></div>
      <div class="flashcard-row"><div class="label">Action</div><div class="value">${drug.action}</div></div>
      <div class="flashcard-row"><div class="label">Indications</div><div class="value">${drug.indications}</div></div>
      <div class="flashcard-row"><div class="label">Contraindications</div><div class="value">${drug.contraindications}</div></div>
      <div class="flashcard-row"><div class="label">Side Effects</div><div class="value">${drug.sideEffects}</div></div>
      <div class="flashcard-row"><div class="label">Adult Dose</div><div class="value">${drug.adultDose}</div></div>
      <div class="flashcard-row"><div class="label">Pediatric Dose</div><div class="value">${drug.pediatricDose}</div></div>
    `;
  }

  document.getElementById('fc-progress').textContent = `${currentIndex + 1} / ${currentDeck.length}`;
  document.getElementById('card-counter-num').textContent = currentIndex + 1;
  document.getElementById('card-counter-total').textContent = currentDeck.length;

  // sync star button state for this drug
  const starBtn = document.getElementById('card-star');
  if (starBtn) {
    starBtn.classList.toggle('starred', isStarred(drug.id));
  }

  // disable prev at start (we don't wrap; matches Quizlet)
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  if (prevBtn) prevBtn.disabled = currentIndex === 0;
  if (nextBtn) nextBtn.disabled = currentIndex >= currentDeck.length - 1;
}

function flipCard() {
  if (suppressNextTap) { suppressNextTap = false; return; }
  const card = document.getElementById('flashcard');
  card.classList.toggle('flipped');
  const ratingBar = document.getElementById('card-rating-bar');
  if (ratingBar) {
    ratingBar.style.display = card.classList.contains('flipped') ? 'flex' : 'none';
  }
}

function toggleCurrentStar() {
  if (currentDeck.length === 0) return;
  const drug = currentDeck[currentIndex];
  toggleStar(drug.id);
  const starBtn = document.getElementById('card-star');
  starBtn.classList.toggle('starred', isStarred(drug.id));
  starBtn.classList.remove('pulse');
  void starBtn.offsetWidth;  // restart animation
  starBtn.classList.add('pulse');
}

function nextCard() {
  if (currentDeck.length === 0) return;
  if (currentIndex < currentDeck.length - 1) {
    animateSwipe('left', () => {
      currentIndex++;
      renderCard();
    });
  } else {
    showDeckComplete();
  }
}

function prevCard() {
  if (currentDeck.length === 0 || currentIndex === 0) return;
  animateSwipe('right', () => {
    currentIndex--;
    renderCard();
  });
}

function animateSwipe(direction, onMid) {
  const container = document.getElementById('flashcard-container');
  if (!container) { onMid(); return; }
  const outClass = direction === 'left' ? 'swipe-left' : 'swipe-right';
  const inClass  = direction === 'left' ? 'swipe-in-left' : 'swipe-in-right';
  container.classList.add(outClass);
  setTimeout(() => {
    container.classList.remove(outClass);
    onMid();
    container.classList.add(inClass);
    setTimeout(() => container.classList.remove(inClass), 260);
  }, 230);
}

function markGotIt() {
  const drug = currentDeck[currentIndex];
  applyRating(drug, 3);  // Good
  nextOrComplete();
}

function markLearning() {
  const drug = currentDeck[currentIndex];
  if (!isStarred(drug.id)) toggleStar(drug.id);  // auto-star struggling cards
  applyRating(drug, 1);  // Again
  nextOrComplete();
}

function nextOrComplete() {
  if (currentIndex >= currentDeck.length - 1) {
    showDeckComplete();
  } else {
    nextCard();
  }
}

function applyRating(drug, rating) {
  const p = getDrugProgress(drug.id);
  p.reviews++;
  progress.totalReviews++;
  if (rating === 1) {
    p.interval = 0;
    p.ease = Math.max(1.3, p.ease - 0.2);
  } else {
    p.correct++;
    if (rating === 2) {
      p.interval = Math.max(0.007, p.interval * 1.2 || 0.007);
      p.ease = Math.max(1.3, p.ease - 0.15);
    } else if (rating === 3) {
      p.interval = p.interval === 0 ? 1 : p.interval * p.ease;
    } else if (rating === 4) {
      p.interval = p.interval === 0 ? 4 : p.interval * p.ease * 1.3;
      p.ease = p.ease + 0.15;
    }
  }
  p.dueAt = Date.now() + p.interval * 24 * 60 * 60 * 1000;
  updateStreak();
  saveProgress();
}

function showDeckComplete() {
  const total = currentDeck.length;
  const starred = currentDeck.filter(d => isStarred(d.id)).length;
  document.getElementById('fc-front').innerHTML = `
    <div class="empty-state">
      <div class="emoji">🎉</div>
      <h3>Deck complete!</h3>
      <p>You reviewed ${total} card${total === 1 ? '' : 's'}.${starred > 0 ? `<br>${starred} card${starred === 1 ? ' is' : 's are'} starred for follow-up.` : ''}</p>
      <button class="primary-btn" style="margin-top:20px" onclick="restartDeck()">Study Again</button>
      ${starred > 0 ? `<button class="primary-btn" style="margin-top:8px;background:var(--warning)" onclick="startFlashcards('starred')">Study Starred (${starred})</button>` : ''}
      <button class="nav-btn" style="margin-top:8px;padding:14px 24px" onclick="goTo('home')">Home</button>
    </div>
  `;
  document.getElementById('fc-back').innerHTML = '';
  document.getElementById('card-rating-bar').style.display = 'none';
  document.getElementById('flashcard').classList.remove('flipped');
}

function restartDeck() {
  currentIndex = 0;
  // reshuffle
  for (let i = currentDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [currentDeck[i], currentDeck[j]] = [currentDeck[j], currentDeck[i]];
  }
  renderCard();
}

function updateStreak() {
  const today = new Date().toDateString();
  if (progress.lastStudyDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (progress.lastStudyDate === yesterday) {
      progress.streak++;
    } else if (progress.lastStudyDate !== today) {
      progress.streak = 1;
    }
    progress.lastStudyDate = today;
  }
}

// === QUIZ ===
function renderQuizSetup() {
  const sel = document.getElementById('quiz-category');
  sel.innerHTML = '<option value="all">All categories</option>';
  CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    sel.appendChild(opt);
  });
}

function startQuiz() {
  const count = parseInt(document.getElementById('quiz-count').value);
  const category = document.getElementById('quiz-category').value;
  const type = document.getElementById('quiz-type').value;
  let pool = [...DRUGS];
  if (category !== 'all') pool = pool.filter(d => d.category === category);
  if (pool.length < 4) {
    alert('Not enough drugs in this category for a quiz. Need at least 4.');
    return;
  }
  // Generate questions
  const questions = [];
  for (let i = 0; i < count; i++) {
    const drug = pool[Math.floor(Math.random() * pool.length)];
    const q = generateQuestion(drug, type, pool);
    if (q) questions.push(q);
  }
  currentQuiz = { questions, index: 0, correct: 0, answers: [] };
  goTo('quiz');
  renderQuizQuestion();
}

function generateQuestion(drug, type, pool) {
  const types = type === 'mixed'
    ? ['indication', 'class', 'dose', 'contraindication', 'action', 'reverse']
    : [type];
  const qType = types[Math.floor(Math.random() * types.length)];

  // For "reverse" — given an indication, identify the drug
  if (qType === 'reverse') {
    const distractors = pickDistractors(drug, pool, 3, 'generic');
    const options = shuffle([drug.generic, ...distractors.map(d => d.generic)]);
    return {
      typeLabel: 'Identify the Drug',
      question: `Which drug is indicated for: <span class="highlight">${drug.indications}</span>?`,
      options,
      correct: drug.generic,
      explanation: `${drug.generic} (${drug.trade !== '—' ? drug.trade : 'no trade name'}) — ${drug.class}. Used for: ${drug.indications}`,
      drug
    };
  }

  let field, label, questionText;
  if (qType === 'indication') {
    field = 'indications';
    label = 'Indication';
    questionText = `What is the indication for <span class="highlight">${drug.generic}</span>${drug.trade !== '—' ? ' (' + drug.trade + ')' : ''} in <span class="highlight">${drug.category}</span>?`;
  } else if (qType === 'class') {
    field = 'class';
    label = 'Drug Class';
    questionText = `What class does <span class="highlight">${drug.generic}</span> belong to (${drug.category} use)?`;
  } else if (qType === 'dose') {
    field = 'adultDose';
    label = 'Adult Dose';
    questionText = `What is the adult dose of <span class="highlight">${drug.generic}</span> for <span class="highlight">${drug.category}</span>?`;
  } else if (qType === 'contraindication') {
    field = 'contraindications';
    label = 'Contraindications';
    questionText = `Which are contraindications for <span class="highlight">${drug.generic}</span> (${drug.category})?`;
  } else if (qType === 'action') {
    field = 'action';
    label = 'Mechanism of Action';
    questionText = `What is the mechanism of action of <span class="highlight">${drug.generic}</span> in <span class="highlight">${drug.category}</span>?`;
  }

  const correctAnswer = drug[field];
  // Filter distractors to ones with different field values
  const candidates = pool.filter(d => d.id !== drug.id && d[field] && d[field] !== correctAnswer);
  // Prefer same category for harder questions
  const sameCat = candidates.filter(d => d.category === drug.category);
  let distPool = sameCat.length >= 3 ? sameCat : candidates;
  // Dedupe by field value
  const seen = new Set([correctAnswer]);
  const distractors = [];
  shuffle(distPool).forEach(d => {
    if (distractors.length < 3 && !seen.has(d[field])) {
      distractors.push(d[field]);
      seen.add(d[field]);
    }
  });
  // If not enough, pad from full pool
  if (distractors.length < 3) {
    DRUGS.forEach(d => {
      if (distractors.length < 3 && !seen.has(d[field]) && d[field]) {
        distractors.push(d[field]);
        seen.add(d[field]);
      }
    });
  }
  const options = shuffle([correctAnswer, ...distractors]);
  return {
    typeLabel: label,
    question: questionText,
    options,
    correct: correctAnswer,
    explanation: `${drug.generic}${drug.trade !== '—' ? ' (' + drug.trade + ')' : ''} — ${label}: ${correctAnswer}`,
    drug
  };
}

function pickDistractors(drug, pool, n, key) {
  const sameCat = pool.filter(d => d.id !== drug.id && d.category === drug.category && d[key] !== drug[key]);
  const others = pool.filter(d => d.id !== drug.id && d.category !== drug.category && d[key] !== drug[key]);
  const seen = new Set([drug[key]]);
  const result = [];
  shuffle(sameCat).forEach(d => {
    if (result.length < n && !seen.has(d[key])) { result.push(d); seen.add(d[key]); }
  });
  shuffle(others).forEach(d => {
    if (result.length < n && !seen.has(d[key])) { result.push(d); seen.add(d[key]); }
  });
  return result;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuizQuestion() {
  const { questions, index } = currentQuiz;
  const q = questions[index];
  document.getElementById('quiz-counter').textContent = `${index + 1}/${questions.length}`;
  document.getElementById('quiz-progress-fill').style.width = ((index) / questions.length * 100) + '%';

  const content = document.getElementById('quiz-content');
  content.innerHTML = `
    <div class="quiz-card">
      <div class="quiz-question-type">${q.typeLabel}</div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options" id="quiz-options"></div>
    </div>
  `;
  const optBox = document.getElementById('quiz-options');
  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.onclick = () => answerQuiz(opt, btn);
    optBox.appendChild(btn);
  });
}

function answerQuiz(selected, btn) {
  const q = currentQuiz.questions[currentQuiz.index];
  const isCorrect = selected === q.correct;
  if (isCorrect) currentQuiz.correct++;
  currentQuiz.answers.push({ q, selected, isCorrect });

  // update drug progress
  const dp = getDrugProgress(q.drug.id);
  dp.reviews++;
  if (isCorrect) dp.correct++;
  progress.totalReviews++;
  updateStreak();
  saveProgress();

  document.querySelectorAll('.quiz-option').forEach(b => {
    b.classList.add('revealed');
    if (b.textContent === q.correct) b.classList.add('correct');
    else if (b === btn) b.classList.add('wrong');
    else b.classList.add('fade');
    b.onclick = null;
  });

  // Show explanation + next button
  const card = document.querySelector('#view-quiz .quiz-card');
  const fb = document.createElement('div');
  fb.className = 'quiz-feedback';
  fb.innerHTML = `
    <h4>${isCorrect ? '✓ Correct' : '✗ Not quite'}</h4>
    <p>${q.explanation}</p>
  `;
  card.appendChild(fb);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'primary-btn';
  nextBtn.textContent = currentQuiz.index === currentQuiz.questions.length - 1 ? 'See Results →' : 'Next Question →';
  nextBtn.onclick = nextQuiz;
  card.appendChild(nextBtn);
}

function nextQuiz() {
  currentQuiz.index++;
  if (currentQuiz.index >= currentQuiz.questions.length) {
    showQuizResults();
  } else {
    renderQuizQuestion();
  }
}

function showQuizResults() {
  const { correct, questions } = currentQuiz;
  const pct = Math.round((correct / questions.length) * 100);
  let msg = "Keep practicing!";
  let emoji = "💪";
  if (pct === 100) { msg = "Perfect score!"; emoji = "🏆"; }
  else if (pct >= 90) { msg = "Excellent work!"; emoji = "🌟"; }
  else if (pct >= 75) { msg = "Solid performance!"; emoji = "👍"; }
  else if (pct >= 60) { msg = "Getting there!"; emoji = "📚"; }

  document.getElementById('quiz-content').innerHTML = `
    <div class="quiz-results">
      <div class="score-circle">${pct}%</div>
      <h2>${emoji} ${msg}</h2>
      <p>You got ${correct} out of ${questions.length} correct.</p>
      <button class="primary-btn" onclick="goTo('quiz-setup')">New Quiz</button>
      <button class="nav-btn" style="margin-top:12px;width:100%;padding:14px" onclick="goTo('home')">Home</button>
    </div>
  `;
  document.getElementById('quiz-progress-fill').style.width = '100%';
}

function confirmExitQuiz() {
  if (currentQuiz && currentQuiz.index < currentQuiz.questions.length - 1 &&
      !confirm('Exit quiz? Your progress will be lost.')) return;
  goTo('home');
}

// === BROWSE ===
let activeFilter = 'all';

function renderBrowse() {
  const row = document.getElementById('filter-row');
  row.innerHTML = '';
  const allChip = document.createElement('button');
  allChip.className = 'filter-chip' + (activeFilter === 'all' ? ' active' : '');
  allChip.textContent = 'All';
  allChip.onclick = () => { activeFilter = 'all'; renderBrowse(); };
  row.appendChild(allChip);
  CATEGORIES.forEach(cat => {
    const chip = document.createElement('button');
    chip.className = 'filter-chip' + (activeFilter === cat ? ' active' : '');
    chip.textContent = cat;
    chip.onclick = () => { activeFilter = cat; renderBrowse(); };
    row.appendChild(chip);
  });
  filterDrugs();
}

function filterDrugs() {
  const q = document.getElementById('search-input').value.toLowerCase().trim();
  const list = document.getElementById('drug-list');
  list.innerHTML = '';
  let drugs = DRUGS;
  if (activeFilter !== 'all') drugs = drugs.filter(d => d.category === activeFilter);
  if (q) {
    drugs = drugs.filter(d =>
      d.generic.toLowerCase().includes(q) ||
      d.trade.toLowerCase().includes(q) ||
      d.class.toLowerCase().includes(q) ||
      d.indications.toLowerCase().includes(q)
    );
  }
  if (drugs.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="emoji">🔍</div><h3>No drugs found</h3><p>Try a different search</p></div>';
    return;
  }
  drugs.sort((a, b) => a.generic.localeCompare(b.generic));
  drugs.forEach(drug => {
    const lvl = masteryLevel(drug.id);
    const color = CATEGORY_COLORS[drug.category] || '#64748b';
    const item = document.createElement('div');
    item.className = 'drug-item';
    item.innerHTML = `
      <div class="cat-bar" style="background:${color}"></div>
      <div class="info">
        <div class="name">${drug.generic}${drug.trade !== '—' ? ' <span style="color:var(--text-dim);font-weight:500">(' + drug.trade + ')</span>' : ''}</div>
        <div class="meta">${drug.category} • ${drug.class}</div>
      </div>
      <div class="mastery-dot ${lvl}" title="${lvl}"></div>
    `;
    item.onclick = () => showDrugModal(drug);
    list.appendChild(item);
  });
}

function showDrugModal(drug) {
  const color = CATEGORY_COLORS[drug.category] || '#64748b';
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-handle"></div>
    <span class="category-tag" style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:white;margin-bottom:12px;background:${color}">${drug.category}</span>
    <h2>${drug.generic}</h2>
    ${drug.trade !== '—' ? `<div class="trade">(${drug.trade})</div>` : '<div style="margin-bottom:16px"></div>'}
    <div class="modal-row"><div class="label">Class</div><div class="value">${drug.class}</div></div>
    <div class="modal-row"><div class="label">Action</div><div class="value">${drug.action}</div></div>
    <div class="modal-row"><div class="label">Indications</div><div class="value">${drug.indications}</div></div>
    <div class="modal-row"><div class="label">Contraindications</div><div class="value">${drug.contraindications}</div></div>
    <div class="modal-row"><div class="label">Side Effects</div><div class="value">${drug.sideEffects}</div></div>
    <div class="modal-row"><div class="label">Adult Dose</div><div class="value">${drug.adultDose}</div></div>
    <div class="modal-row"><div class="label">Pediatric Dose</div><div class="value">${drug.pediatricDose}</div></div>
  `;
  document.getElementById('modal-backdrop').classList.add('active');
}

function closeModal(event) {
  if (event.target.id === 'modal-backdrop') {
    document.getElementById('modal-backdrop').classList.remove('active');
  }
}

// === PROGRESS ===
function renderProgressView() {
  let mastered = 0, learning = 0;
  DRUGS.forEach(d => {
    const lvl = masteryLevel(d.id);
    if (lvl === 'mastered') mastered++;
    else if (lvl === 'learning') learning++;
  });
  document.getElementById('stat-mastered').textContent = mastered;
  document.getElementById('stat-learning').textContent = learning;
  document.getElementById('stat-reviews').textContent = progress.totalReviews;
  document.getElementById('stat-streak').textContent = progress.streak;

  const catContainer = document.getElementById('category-progress');
  catContainer.innerHTML = '';
  CATEGORIES.forEach(cat => {
    const drugsInCat = DRUGS.filter(d => d.category === cat);
    const masteredInCat = drugsInCat.filter(d => masteryLevel(d.id) === 'mastered').length;
    const pct = drugsInCat.length > 0 ? Math.round((masteredInCat / drugsInCat.length) * 100) : 0;
    const color = CATEGORY_COLORS[cat] || '#64748b';
    const div = document.createElement('div');
    div.style.cssText = 'background:var(--bg-2);border:1px solid var(--border);border-radius:12px;padding:14px;margin-bottom:8px';
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <div style="font-weight:700;font-size:14px"><span style="display:inline-block;width:8px;height:8px;border-radius:999px;margin-right:6px;background:${color}"></span>${cat}</div>
        <div style="font-size:13px;color:var(--text-dim)">${masteredInCat} / ${drugsInCat.length}</div>
      </div>
      <div style="background:var(--bg-3);height:6px;border-radius:999px;overflow:hidden">
        <div style="background:${color};height:100%;width:${pct}%;transition:width 0.5s"></div>
      </div>
    `;
    catContainer.appendChild(div);
  });
}

function resetProgress() {
  if (!confirm('Reset all progress? This cannot be undone.')) return;
  progress = { drugs: {}, totalReviews: 0, lastStudyDate: null, streak: 0 };
  saveProgress();
  renderProgressView();
  alert('Progress reset.');
}

// === DRILL MODE ===
function renderDrillSetup() {
  const grid = document.getElementById('drill-field-grid');
  grid.innerHTML = '';
  const fields = [
    { key: 'indications', icon: '🎯', desc: 'When to use it', rec: true },
    { key: 'class', icon: '🏷️', desc: 'What kind of drug' },
    { key: 'adultDose', icon: '💉', desc: 'Adult dosing' },
    { key: 'contraindications', icon: '🚫', desc: 'When NOT to use' },
    { key: 'sideEffects', icon: '⚠️', desc: 'Adverse effects' },
    { key: 'action', icon: '⚙️', desc: 'How it works' },
    { key: 'pediatricDose', icon: '👶', desc: 'Peds dosing' }
  ];
  fields.forEach(f => {
    const btn = document.createElement('button');
    btn.className = 'drill-field-btn' + (drillField === f.key ? ' selected' : '');
    btn.onclick = () => { drillField = f.key; renderDrillSetup(); };
    btn.innerHTML = `
      <span class="icon">${f.icon}</span>
      <div class="title">${FIELD_LABELS[f.key]}</div>
      <div class="desc">${f.desc}</div>
      ${f.rec ? '<span class="rec-tag">START</span>' : ''}
    `;
    grid.appendChild(btn);
  });

  const sel = document.getElementById('drill-category');
  if (sel.options.length <= 1) {
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      sel.appendChild(opt);
    });
  }

  const startBtn = document.getElementById('drill-start-btn');
  if (drillField) {
    startBtn.disabled = false;
    startBtn.textContent = `Start ${FIELD_LABELS[drillField]} Drill →`;
  } else {
    startBtn.disabled = true;
    startBtn.textContent = 'Pick a field above';
  }
}

function startDrill() {
  if (!drillField) return;
  const category = document.getElementById('drill-category').value;
  currentDeck = buildDeck(category === 'all' ? 'all' : 'category', category);
  currentIndex = 0;
  goTo('flashcards');
  renderCard();
}

// === DRUG FAMILIES ===
function renderFamilies() {
  const list = document.getElementById('families-list');
  list.innerHTML = '';
  DRUG_FAMILIES.forEach((fam, i) => {
    const card = document.createElement('div');
    card.className = 'family-card';
    card.innerHTML = `
      <div class="family-icon">${fam.icon}</div>
      <div class="info">
        <div class="name">${fam.name}</div>
        <div class="meta">${fam.drugIds.length} drugs • ${fam.description}</div>
      </div>
      <div class="arrow">→</div>
    `;
    card.onclick = () => openFamily(i);
    list.appendChild(card);
  });
}

function openFamily(idx) {
  const fam = DRUG_FAMILIES[idx];
  document.getElementById('family-title').textContent = fam.name;
  const drugs = fam.drugIds.map(id => DRUGS.find(d => d.id === id)).filter(Boolean);

  const fields = [
    { key: 'class', label: 'Class' },
    { key: 'indications', label: 'Indications' },
    { key: 'contraindications', label: 'Contraindications' },
    { key: 'sideEffects', label: 'Side Effects' },
    { key: 'adultDose', label: 'Adult Dose' },
    { key: 'pediatricDose', label: 'Pediatric Dose' },
    { key: 'action', label: 'Mechanism of Action' }
  ];

  let html = `<div class="family-tip">
    <div class="label">🧠 Key to Remember</div>
    <div class="text">${fam.keyDifference}</div>
  </div>`;

  html += `<div class="family-section"><h3>Drugs in this family</h3>`;
  drugs.forEach(d => {
    const color = CATEGORY_COLORS[d.category] || '#64748b';
    html += `<div class="family-row">
      <strong style="color:${color}">${d.generic}</strong>${d.trade !== '—' ? ' <em style="color:var(--text-dim)">(' + d.trade + ')</em>' : ''}
      <span class="drug-cat"> — ${d.category}</span>
    </div>`;
  });
  html += `</div>`;

  fields.forEach(f => {
    html += `<div class="family-section"><h3>${f.label}</h3>`;
    drugs.forEach(d => {
      html += `<div class="family-row">
        <span class="drug-label">${d.generic}</span>
        <span class="drug-cat">(${d.category})</span>:
        ${d[f.key]}
      </div>`;
    });
    html += `</div>`;
  });

  document.getElementById('family-compare-content').innerHTML = html;
  goTo('family-compare');
}

// === CLINICAL SCENARIOS ===
function renderScenarios() {
  const correct = SCENARIOS.filter(s => progress.scenarios[s.id] === 'correct').length;
  const attempted = SCENARIOS.filter(s => progress.scenarios[s.id]).length;
  document.getElementById('scenario-stats').innerHTML =
    `<strong>${correct}</strong> / ${SCENARIOS.length} correct · ${attempted} attempted`;

  const list = document.getElementById('scenarios-list');
  list.innerHTML = '';
  SCENARIOS.forEach((s, i) => {
    const status = progress.scenarios[s.id];
    const statusIcon = status === 'correct' ? '✓' : status === 'incorrect' ? '✗' : '○';
    const cls = status === 'correct' ? 'status-correct' : status === 'incorrect' ? 'status-incorrect' : '';
    const card = document.createElement('div');
    card.className = 'scenario-list-card ' + cls;
    card.innerHTML = `
      <div class="scenario-icon">${s.icon}</div>
      <div class="scenario-info">
        <div class="scenario-title">${s.title}</div>
        <div class="scenario-cat">${s.category}</div>
      </div>
      <div class="scenario-status">${statusIcon}</div>
    `;
    card.onclick = () => openScenario(i);
    list.appendChild(card);
  });
}

function startScenarioSequence() {
  currentScenarioIdx = 0;
  openScenario(0);
}

function randomScenario() {
  currentScenarioIdx = Math.floor(Math.random() * SCENARIOS.length);
  openScenario(currentScenarioIdx);
}

function openScenario(idx) {
  currentScenarioIdx = idx;
  renderScenarioRunner();
  goTo('scenario-runner');
}

function renderScenarioRunner() {
  const s = SCENARIOS[currentScenarioIdx];
  document.getElementById('scenario-runner-counter').textContent =
    `${currentScenarioIdx + 1} / ${SCENARIOS.length}`;

  const content = document.getElementById('scenario-content');
  content.innerHTML = `
    <div class="scenario-counter">Scenario ${currentScenarioIdx + 1} of ${SCENARIOS.length}</div>
    <div class="scenario-case">
      <div class="scenario-case-header">
        <span class="scenario-icon">${s.icon}</span>
        <div>
          <div class="scenario-case-title">${s.title}</div>
          <div class="scenario-case-cat">${s.category}</div>
        </div>
      </div>
      <div class="scenario-presentation">${s.presentation}</div>
      <div class="scenario-vitals"><strong>Vitals:</strong>${s.vitals}</div>
    </div>
    <div class="scenario-question">${s.question}</div>
    <div class="scenario-options" id="scenario-options"></div>
  `;
  const opts = document.getElementById('scenario-options');
  s.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'scenario-option';
    btn.textContent = opt;
    btn.onclick = () => answerScenario(i, btn);
    opts.appendChild(btn);
  });
}

function answerScenario(idx, clickedBtn) {
  const s = SCENARIOS[currentScenarioIdx];
  const isCorrect = idx === s.correctIndex;
  progress.scenarios[s.id] = isCorrect ? 'correct' : 'incorrect';
  saveProgress();

  document.querySelectorAll('.scenario-option').forEach((b, i) => {
    b.classList.add('revealed');
    if (i === s.correctIndex) b.classList.add('correct');
    else if (i === idx) b.classList.add('wrong');
    else b.classList.add('fade');
    b.onclick = null;
  });

  const content = document.getElementById('scenario-content');

  const fb = document.createElement('div');
  fb.className = 'scenario-feedback ' + (isCorrect ? 'correct' : 'wrong');
  fb.innerHTML = `
    <div class="feedback-header">${isCorrect ? '✓ Correct' : '✗ Not the best choice'}</div>
    <div class="feedback-text">${s.explanation}</div>
  `;
  content.appendChild(fb);

  if (s.drugRefs && s.drugRefs.length > 0) {
    const refs = document.createElement('div');
    refs.className = 'scenario-refs';
    refs.innerHTML = '<div class="refs-label">📖 Review the drug card:</div>';
    s.drugRefs.forEach(refId => {
      const drug = DRUGS.find(d => d.id === refId);
      if (drug) {
        const link = document.createElement('button');
        link.className = 'ref-link';
        link.textContent = `${drug.generic} (${drug.category})`;
        link.onclick = () => showDrugModal(drug);
        refs.appendChild(link);
      }
    });
    content.appendChild(refs);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'primary-btn';
  if (currentScenarioIdx < SCENARIOS.length - 1) {
    nextBtn.textContent = 'Next Scenario →';
    nextBtn.onclick = () => { currentScenarioIdx++; renderScenarioRunner(); };
  } else {
    nextBtn.textContent = 'See All Scenarios';
    nextBtn.onclick = () => goTo('scenarios');
  }
  content.appendChild(nextBtn);

  const disclaimer = document.createElement('div');
  disclaimer.className = 'scenario-disclaimer';
  disclaimer.textContent = 'Scenarios are NREMT-style practice based on your drug-card PDF. Always follow your local protocols in the field.';
  content.appendChild(disclaimer);
}

// === FLASHCARD INPUT HANDLERS (tap, swipe, keyboard, star) ===
let suppressNextTap = false;
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

function initFlashcardHandlers() {
  const container = document.getElementById('flashcard-container');
  const flashcard = document.getElementById('flashcard');
  const starBtn = document.getElementById('card-star');
  if (!container || !flashcard) return;

  // Tap to flip
  flashcard.addEventListener('click', flipCard);

  // Star button (don't bubble to flip)
  starBtn.addEventListener('click', e => {
    e.stopPropagation();
    toggleCurrentStar();
  });

  // Swipe gestures
  container.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
    touchStartTime = Date.now();
  }, { passive: true });

  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].screenX - touchStartX;
    const dy = e.changedTouches[0].screenY - touchStartY;
    const dt = Date.now() - touchStartTime;
    // Horizontal swipe wins if it's mostly horizontal, fast enough, far enough
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 600) {
      suppressNextTap = true;
      if (dx < 0) nextCard();
      else prevCard();
    }
  }, { passive: true });

  // Keyboard (desktop)
  document.addEventListener('keydown', e => {
    const view = document.getElementById('view-flashcards');
    if (!view || !view.classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nextCard(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prevCard(); }
    else if (e.key === ' ') { e.preventDefault(); flipCard(); }
    else if (e.key === 's' || e.key === 'S') { e.preventDefault(); toggleCurrentStar(); }
    else if (e.key === '1') markLearning();
    else if (e.key === '2') markGotIt();
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderHome();
  initFlashcardHandlers();
});
