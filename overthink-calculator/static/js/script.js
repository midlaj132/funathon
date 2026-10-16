(() => {
  'use strict';

  const expressionInput = document.getElementById('expression');
  const answerValue = document.getElementById('answer-value');
  const answerLabel = document.getElementById('answer-label');
  const displayHint = document.getElementById('display-hint');
  const overlay = document.getElementById('flow-overlay');
  const detailsOverlay = document.getElementById('details-overlay');
  const flowContent = document.getElementById('flow-content');
  const flowProgress = document.getElementById('flow-progress-fill');
  const toast = document.getElementById('toast');
  const historyList = document.getElementById('history-list');
  const confettiLayer = document.getElementById('confetti-layer');
  const userDetailsForm = document.getElementById('user-details-form');
  const QUESTION_BANK = [
    {
      prompt: 'Are you emotionally prepared to know the answer?',
      emoji: '😬',
      options: ['Absolutely. I was born ready.', 'I need a tiny pep talk.', 'No, but do it anyway.']
    },
    {
      prompt: 'What is your current emotional condition?',
      emoji: '🫠',
      options: ['Calm as a spreadsheet.', 'Mildly concerned.', 'Full academic panic.']
    },
    {
      prompt: 'Would you like to consult your imaginary mathematics professor?',
      emoji: '👩‍🏫',
      options: ['Yes, schedule a meeting.', 'They are on lunch.', 'I trust this suspicious calculator.']
    },
    {
      prompt: 'Please confirm that you accept the consequences of this calculation.',
      emoji: '📜',
      options: ['I accept the consequences.', 'Can I accept them later?', 'I waive my right to be surprised.']
    },
    {
      prompt: 'How confident are you in your mathematical abilities?',
      emoji: '📈',
      type: 'confidence'
    },
    {
      prompt: 'How many calculators do you think are emotionally involved?',
      emoji: '🧮',
      options: ['One, and it is doing its best.', 'Seventeen, apparently.', 'I refuse to speculate.']
    }
  ];
  const LOADING_MESSAGES = [
    'Consulting 17 imaginary mathematicians...',
    'Asking Einstein for permission...',
    'Recalculating the calculation...',
    'Checking whether your math is still math...',
    'Applying unnecessary complexity...',
    'Polishing the answer for its big moment...',
    'Making the loading bar feel appreciated...'
  ];
  const ANSWER_MESSAGES = [
    'The answer is {answer}. Please try to remain calm.',
    'After years of research, the answer is {answer}.',
    'Our supercomputer has confirmed: {answer}.',
    'You could have done this in your head. Anyway, the answer is {answer}.',
    'The committee has voted. It is {answer}.'
  ];

  const state = {
    questionsAnswered: 0,
    calculations: 0,
    wastedSeconds: 0,
    currentCalculation: null,
    selectedHumanTiles: new Set(),
    questionIndex: 0,
    questions: [],
    stepIndex: 0,
    startedAt: 0,
    lastResult: null,
    loadingTimer: null,
    toastTimer: null,
    geniusMode: false,
    muted: false,
    userProfile: null
  };

  function tokenize(source) {
    const tokens = [];
    let index = 0;
    while (index < source.length) {
      const character = source[index];
      if (/\s/.test(character)) {
        index += 1;
        continue;
      }
      if ('+-*/()%'.includes(character)) {
        tokens.push(character);
        index += 1;
        continue;
      }
      if (/[0-9.]/.test(character)) {
        const match = source.slice(index).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);
        if (!match) throw new Error('That decimal point seems to have lost its number.');
        const value = Number(match[0]);
        if (!Number.isFinite(value)) throw new Error('That number is too large for this calculator.');
        tokens.push(value);
        index += match[0].length;
        continue;
      }
      throw new Error(`“${character}” is not a supported math symbol.`);
    }
    if (tokens.length === 0) throw new Error('Enter an expression first. The calculator is dramatic, not psychic.');
    return tokens;
  }

  function evaluateExpression(source) {
    const tokens = tokenize(source);
    let position = 0;

    function parseExpression() {
      let value = parseTerm();
      while (tokens[position] === '+' || tokens[position] === '-') {
        const operator = tokens[position++];
        const right = parseTerm();
        value = operator === '+' ? value + right : value - right;
      }
      return value;
    }

    function parseTerm() {
      let value = parseUnary();
      while (tokens[position] === '*' || tokens[position] === '/') {
        const operator = tokens[position++];
        const right = parseUnary();
        if (operator === '/' && right === 0) throw new Error('Division by zero. Even this calculator has boundaries.');
        value = operator === '*' ? value * right : value / right;
      }
      return value;
    }

    function parseUnary() {
      if (tokens[position] === '+') {
        position += 1;
        return parseUnary();
      }
      if (tokens[position] === '-') {
        position += 1;
        return -parseUnary();
      }
      let value = parsePrimary();
      while (tokens[position] === '%') {
        position += 1;
        value /= 100;
      }
      return value;
    }

    function parsePrimary() {
      const token = tokens[position++];
      if (typeof token === 'number') return token;
      if (token === '(') {
        const value = parseExpression();
        if (tokens[position] !== ')') throw new Error('One of your parentheses has wandered off.');
        position += 1;
        return value;
      }
      if (token === undefined || token === ')') throw new Error('This expression needs a number in there somewhere.');
      throw new Error('That operator is waiting for a number.');
    }

    const result = parseExpression();
    if (position !== tokens.length) {
      if (tokens[position] === ')') throw new Error('There is one too many closing parentheses.');
      throw new Error('Add an operator between those numbers.');
    }
    if (!Number.isFinite(result)) throw new Error('That result is too large to display responsibly.');
    return Object.is(result, -0) ? 0 : result;
  }

  function formatNumber(number) {
    return Number(number.toPrecision(12)).toString();
  }

  function playTone(frequency = 540, duration = 0.07) {
    if (state.muted) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    try {
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.055, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + duration);
      oscillator.addEventListener('ended', () => context.close());
    } catch (error) {
      console.warn('Sound effects could not be played:', error);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2600);
  }

  function setExpressionValue(value) {
    expressionInput.value = value;
    expressionInput.focus();
    expressionInput.setSelectionRange(value.length, value.length);
    displayHint.textContent = 'READY WHEN YOU ARE';
  }

  function updateScore() {
    const elapsedDuringFlow = state.currentCalculation
      ? Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000))
      : 0;
    const score = Math.min(100, state.questionsAnswered * 5 + Math.floor((state.wastedSeconds + elapsedDuringFlow) * 1.5) + state.calculations * 2);
    document.getElementById('score-value').textContent = String(score);
    document.getElementById('score-fill').style.width = `${score}%`;
    document.getElementById('questions-count').textContent = String(state.questionsAnswered);
    document.getElementById('time-wasted').textContent = `${state.wastedSeconds + elapsedDuringFlow}s`;
    document.getElementById('calculations-count').textContent = String(state.calculations);
    const rank = score >= 80 ? 'Certified Time Waster' : score >= 50 ? 'Professional Overthinker' : score >= 20 ? 'Enthusiastic Procrastinator' : score > 0 ? 'Apprentice Overthinker' : 'Unranked Calculator User';
    document.getElementById('score-title').textContent = rank;
  }

  function readUserProfile() {
    try {
      const saved = JSON.parse(localStorage.getItem('overthink-user-profile') || 'null');
      if (!saved || typeof saved !== 'object') return null;
      const profile = {
        fullName: String(saved.fullName || '').trim(),
        email: String(saved.email || '').trim(),
        college: String(saved.college || '').trim(),
        major: String(saved.major || '').trim(),
        graduationYear: String(saved.graduationYear || '').trim(),
        excuse: String(saved.excuse || '').trim()
      };
      const complete = Object.values(profile).every((value) => value.length > 0);
      return complete ? profile : null;
    } catch (error) {
      console.warn('User profile could not be loaded:', error);
      return null;
    }
  }

  function saveUserProfile(profile) {
    try {
      localStorage.setItem('overthink-user-profile', JSON.stringify(profile));
      state.userProfile = profile;
    } catch (error) {
      console.warn('User profile could not be saved:', error);
      showToast('Your identity details could not be saved in browser storage.');
    }
  }

  function ensureUserProfile() {
    state.userProfile = readUserProfile();
    if (!state.userProfile) {
      detailsOverlay.classList.remove('hidden');
      showToast('Complete your profile before the calculator will permit a result.');
      return false;
    }
    detailsOverlay.classList.add('hidden');
    return true;
  }

  function readSavedState() {
    try {
      const saved = JSON.parse(localStorage.getItem('overthink-calculator') || '{}');
      state.questionsAnswered = Number.isSafeInteger(saved.questionsAnswered) ? saved.questionsAnswered : 0;
      state.calculations = Number.isSafeInteger(saved.calculations) ? saved.calculations : 0;
      state.wastedSeconds = Number.isSafeInteger(saved.wastedSeconds) ? saved.wastedSeconds : 0;
      if (Array.isArray(saved.history)) renderHistory(saved.history);
      if (saved.theme === 'light') document.body.classList.add('light-mode');
      state.muted = saved.muted === true;
    } catch (error) {
      console.warn('Saved calculator settings could not be loaded:', error);
      showToast('Saved stats were unavailable, so this session starts fresh.');
    }
    state.userProfile = readUserProfile();
    updateThemeButton();
    updateSoundButton();
    updateScore();
  }

  function saveState(history) {
    try {
      localStorage.setItem('overthink-calculator', JSON.stringify({
        questionsAnswered: state.questionsAnswered,
        calculations: state.calculations,
        wastedSeconds: state.wastedSeconds,
        history,
        theme: document.body.classList.contains('light-mode') ? 'light' : 'dark',
        muted: state.muted
      }));
    } catch (error) {
      console.warn('Calculator settings could not be saved:', error);
      showToast('Browser storage is unavailable; your stats may not survive a refresh.');
    }
  }

  function getHistory() {
    try {
      const saved = JSON.parse(localStorage.getItem('overthink-calculator') || '{}');
      return Array.isArray(saved.history) ? saved.history : [];
    } catch (error) {
      console.warn('Calculation history could not be read:', error);
      return [];
    }
  }

  function renderHistory(entries = []) {
    historyList.replaceChildren();
    if (entries.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-history';
      empty.textContent = 'No questionable decisions yet.';
      historyList.append(empty);
      return;
    }
    entries.slice(0, 6).forEach((entry) => {
      const button = document.createElement('button');
      button.className = 'history-entry';
      button.type = 'button';
      const expression = document.createElement('span');
      expression.className = 'history-expression';
      expression.textContent = entry.expression;
      const result = document.createElement('span');
      result.className = 'history-result';
      result.textContent = `= ${entry.result}`;
      button.append(expression, result);
      button.addEventListener('click', () => {
        setExpressionValue(entry.expression);
        answerLabel.textContent = 'PREVIOUSLY CONFIRMED RESULT';
        answerValue.textContent = entry.result;
      });
      historyList.append(button);
    });
  }

  function persistHistoryEntry(calculation) {
    const entry = {
      expression: calculation.expression,
      result: formatNumber(calculation.result),
      date: new Date().toISOString()
    };
    const entries = [entry, ...getHistory()].slice(0, 6);
    renderHistory(entries);
    return entries;
  }

  function updateThemeButton() {
    const light = document.body.classList.contains('light-mode');
    const button = document.getElementById('theme-toggle');
    button.textContent = light ? '🌙' : '☀️';
    button.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
  }

  function updateSoundButton() {
    const button = document.getElementById('sound-toggle');
    button.textContent = state.muted ? '🔇' : '🔊';
    button.setAttribute('aria-label', state.muted ? 'Enable sound effects' : 'Mute sound effects');
  }

  function setProgress(current, total) {
    flowProgress.style.width = `${Math.min(100, Math.round((current / total) * 100))}%`;
  }

  function chooseQuestions() {
    const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
    const count = 4 + Math.floor(Math.random() * 3);
    return shuffled.slice(0, count);
  }

  function beginCalculation() {
    if (!ensureUserProfile()) return;
    if (state.currentCalculation) return;
    const expression = expressionInput.value.trim();
    let result;
    try {
      result = evaluateExpression(expression);
    } catch (error) {
      displayHint.textContent = 'MATH EMERGENCY';
      answerLabel.textContent = 'WE FOUND A MATHEMATICAL CONCERN';
      answerValue.textContent = '';
      showToast(error.message);
      playTone(230, 0.12);
      return;
    }
    state.currentCalculation = { expression, result };
    state.startedAt = Date.now();
    state.questionsAnswered = Number(state.questionsAnswered);
    state.questions = state.geniusMode ? [] : chooseQuestions();
    state.questionIndex = 0;
    state.stepIndex = 0;
    state.selectedHumanTiles.clear();
    overlay.classList.remove('hidden');
    updateScore();
    playTone(650);
    if (state.geniusMode) {
      renderLoading(true);
    } else {
      renderQuestion();
    }
  }

  function flowStepCount() {
    return state.questions.length + 4;
  }

  function renderQuestion() {
    const question = state.questions[state.questionIndex];
    state.stepIndex = state.questionIndex;
    setProgress(state.stepIndex, flowStepCount());
    const profileSummary = state.userProfile
      ? `<div class="profile-summary">Profile review: ${state.userProfile.fullName} · ${state.userProfile.college} · ${state.userProfile.major}</div>`
      : '';
    const commonStart = `<span class="flow-emoji">${question.emoji}</span><span class="section-kicker">UNNECESSARY QUESTION ${state.questionIndex + 1} OF ${state.questions.length}</span><h2 id="flow-title">${question.prompt}</h2>${profileSummary}<p>Your answer will be filed under “important for absolutely no reason.”</p>`;
    if (question.type === 'confidence') {
      flowContent.innerHTML = `${commonStart}<div class="confidence-row"><button class="confidence-button" data-confidence="1" type="button">1%</button><button class="confidence-button" data-confidence="25" type="button">25%</button><button class="confidence-button" data-confidence="50" type="button">50%</button><button class="confidence-button" data-confidence="75" type="button">75%</button><button class="confidence-button" data-confidence="100" type="button">100%</button></div><button class="primary-button" id="skip-question" type="button">Submit confidence</button>`;
      let confidence = 50;
      flowContent.querySelectorAll('[data-confidence]').forEach((button) => {
        button.addEventListener('click', () => {
          confidence = Number(button.dataset.confidence);
          flowContent.querySelectorAll('[data-confidence]').forEach((choice) => choice.classList.toggle('selected', choice === button));
        });
      });
      flowContent.querySelector('#skip-question').addEventListener('click', () => answerQuestion());
    } else {
      flowContent.innerHTML = `${commonStart}<div class="question-options">${question.options.map((option, index) => `<button class="question-option" data-option="${index}" type="button">${option}</button>`).join('')}</div>`;
      flowContent.querySelectorAll('[data-option]').forEach((button) => {
        button.addEventListener('click', () => answerQuestion());
      });
    }
    addFastRevealButton();
    playTone(490);
  }

  function answerQuestion() {
    state.questionsAnswered += 1;
    state.questionIndex += 1;
    updateScore();
    playTone(730);
    if (state.questionIndex < state.questions.length) renderQuestion();
    else renderHumanCheck();
  }

  function renderHumanCheck() {
    state.stepIndex = state.questions.length;
    setProgress(state.stepIndex, flowStepCount());
    state.selectedHumanTiles.clear();
    flowContent.innerHTML = `<span class="flow-emoji">🤖</span><span class="section-kicker">TOTALLY REAL HUMAN VERIFICATION</span><h2 id="flow-title">Select all squares containing mathematics.</h2><p>One or more answers are correct. Our robot judges politely.</p><div class="tiles-grid"><button class="fake-checkbox" data-tile="0" type="button"><span></span>2 + 2 = ?</button><button class="fake-checkbox" data-tile="1" type="button"><span></span>a sleepy cat</button><button class="fake-checkbox" data-tile="2" type="button"><span></span>√9</button><button class="fake-checkbox" data-tile="3" type="button"><span></span>an unbuttered toast</button></div><button class="primary-button" id="verify-human" type="button">Verify my humanity</button>`;
    flowContent.querySelectorAll('[data-tile]').forEach((button) => {
      button.addEventListener('click', () => {
        const tile = Number(button.dataset.tile);
        if (state.selectedHumanTiles.has(tile)) state.selectedHumanTiles.delete(tile);
        else state.selectedHumanTiles.add(tile);
        button.classList.toggle('selected');
        button.querySelector('span').textContent = button.classList.contains('selected') ? '✓' : '';
      });
    });
    flowContent.querySelector('#verify-human').addEventListener('click', () => {
      state.questionsAnswered += 1;
      const correct = state.selectedHumanTiles.size === 2 && state.selectedHumanTiles.has(0) && state.selectedHumanTiles.has(2);
      updateScore();
      if (!correct) {
        showToast('Our highly imaginary robot requests the two math squares.');
        playTone(240, 0.1);
        return;
      }
      renderConfidenceCheck();
    });
    addFastRevealButton();
  }

  function renderConfidenceCheck() {
    state.stepIndex = state.questions.length + 1;
    setProgress(state.stepIndex, flowStepCount());
    flowContent.innerHTML = `<span class="flow-emoji">📊</span><span class="section-kicker">CONFIDENCE VERIFICATION</span><h2 id="flow-title">State your confidence level.</h2><p>Any answer is valid. The clipboard is purely decorative.</p><div class="question-options"><button class="question-option" type="button">Confident enough to proceed.</button><button class="question-option" type="button">I have questions about this process.</button><button class="question-option" type="button">Confidence is a social construct.</button></div>`;
    flowContent.querySelectorAll('.question-option').forEach((button) => button.addEventListener('click', () => {
      state.questionsAnswered += 1;
      updateScore();
      playTone(700);
      renderIntelligenceTest();
    }));
    addFastRevealButton();
  }

  function renderIntelligenceTest() {
    state.stepIndex = state.questions.length + 2;
    setProgress(state.stepIndex, flowStepCount());
    flowContent.innerHTML = `<span class="flow-emoji">🧪</span><span class="section-kicker">FAKE MATHEMATICAL INTELLIGENCE TEST</span><h2 id="flow-title">A final, extremely scientific test.</h2><p>What is 2 + 2? No calculators. Except this one.</p><div class="question-options"><button class="question-option" type="button">3 (bold theory)</button><button class="question-option" type="button">4 (textbook energy)</button><button class="question-option" type="button">5 (confidently incorrect)</button></div>`;
    flowContent.querySelectorAll('.question-option').forEach((button) => button.addEventListener('click', () => {
      state.questionsAnswered += 1;
      updateScore();
      showToast(button.textContent.startsWith('4') ? 'Correct! Your imaginary diploma is in the mail.' : 'Interesting hypothesis. The committee has noted it.');
      renderLoading(false);
    }));
    addFastRevealButton();
  }

  function addFastRevealButton() {
    const button = document.createElement('button');
    button.className = 'secondary-button fast-reveal';
    button.type = 'button';
    button.textContent = 'Skip the drama — reveal answer now';
    button.addEventListener('click', () => finishCalculation(true));
    flowContent.append(button);
  }

  function renderLoading(isGenius) {
    window.clearInterval(state.loadingTimer);
    state.stepIndex = state.questions.length + 3;
    setProgress(state.stepIndex, flowStepCount());
    flowContent.innerHTML = `<span class="section-kicker">${isGenius ? 'GENIUS MODE: PAPERWORK BYPASSED' : 'CALCULATION IN PROGRESS'}</span><div class="loading-visual" aria-hidden="true">∑</div><h2 id="flow-title">${isGenius ? 'A genius at work.' : 'The answer is in a meeting.'}</h2><p class="loading-message" id="loading-message"></p><div class="loading-track"><span id="loading-fill"></span></div><span class="loading-percent" id="loading-percent">0%</span><div class="result-actions"><button class="secondary-button" id="loading-fast-reveal" type="button">I cannot wait. Show me.</button></div>`;
    const duration = isGenius ? 450 : Number(document.getElementById('duration').value) * 1000;
    const started = Date.now();
    const fill = document.getElementById('loading-fill');
    const percent = document.getElementById('loading-percent');
    const message = document.getElementById('loading-message');
    const fastRevealButton = document.getElementById('loading-fast-reveal');
    fastRevealButton.addEventListener('click', () => finishCalculation(true));
    let messageIndex = -1;
    state.loadingTimer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - started) / duration);
      const percentage = Math.round(progress * 100);
      fill.style.width = `${percentage}%`;
      percent.textContent = `${percentage}%`;
      const nextMessage = Math.min(LOADING_MESSAGES.length - 1, Math.floor(progress * LOADING_MESSAGES.length));
      if (nextMessage !== messageIndex) {
        messageIndex = nextMessage;
        message.textContent = isGenius ? 'Skipping the queue with sheer brainpower...' : LOADING_MESSAGES[messageIndex];
      }
      if (percentage >= 100) finishCalculation(false);
      updateScore();
    }, 80);
  }

  function finishCalculation(skipped) {
    if (!state.currentCalculation) return;
    window.clearInterval(state.loadingTimer);
    state.loadingTimer = null;
    const calculation = state.currentCalculation;
    const elapsed = Math.max(0, Math.ceil((Date.now() - state.startedAt) / 1000));
    state.wastedSeconds += elapsed;
    state.calculations += 1;
    state.lastResult = calculation;
    const answer = formatNumber(calculation.result);
    const message = ANSWER_MESSAGES[Math.floor(Math.random() * ANSWER_MESSAGES.length)].replace('{answer}', answer);
    const history = persistHistoryEntry(calculation);
    saveState(history);
    updateScore();
    answerLabel.textContent = 'THE MATHEMATICS HAS SPOKEN';
    answerValue.textContent = answer;
    displayHint.textContent = 'RESULT CERTIFIED';
    flowProgress.style.width = '100%';
    flowContent.innerHTML = `<span class="flow-emoji">${skipped ? '⚡' : '🎉'}</span><span class="section-kicker">${skipped ? 'UNEXPECTEDLY EFFICIENT' : 'THE MOMENT OF MATHEMATICAL TRUTH'}</span><h2 id="flow-title">Calculation complete.</h2><p class="result-expression">${calculation.expression} =</p><strong class="answer-result">${answer}</strong><p class="result-quote">${message}</p><p>You spent ${elapsed} ${elapsed === 1 ? 'second' : 'seconds'} on this. Your dedication is concerning.</p><div class="result-actions"><button class="primary-button" id="calculate-again" type="button">Calculate again</button><button class="secondary-button" id="result-close" type="button">Admire the answer</button></div>`;
    state.currentCalculation = null;
    updateScore();
    flowContent.querySelector('#calculate-again').addEventListener('click', () => {
      overlay.classList.add('hidden');
      setExpressionValue('');
      answerValue.textContent = '';
      answerLabel.textContent = 'THE ANSWER WILL APPEAR HERE';
      displayHint.textContent = 'READY WHEN YOU ARE';
      expressionInput.focus();
    });
    flowContent.querySelector('#result-close').addEventListener('click', closeFlow);
    if (calculation.expression.length <= 9 && !/[()]/.test(calculation.expression)) launchConfetti();
    playTone(880, 0.15);
  }

  function launchConfetti() {
    const colors = ['#a77bff', '#f179ce', '#6fe3e0', '#78e4ae', '#ffbe75'];
    for (let index = 0; index < 42; index += 1) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.backgroundColor = colors[index % colors.length];
      piece.style.animationDelay = `${Math.random() * 0.65}s`;
      piece.style.setProperty('--drift', `${Math.round(Math.random() * 190 - 95)}px`);
      confettiLayer.append(piece);
      window.setTimeout(() => piece.remove(), 3300);
    }
  }

  function closeFlow() {
    if (state.currentCalculation) {
      window.clearInterval(state.loadingTimer);
      state.loadingTimer = null;
      state.currentCalculation = null;
      updateScore();
    }
    overlay.classList.add('hidden');
  }

  document.getElementById('keypad').addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.action === 'clear') {
      setExpressionValue('');
      answerValue.textContent = '';
      answerLabel.textContent = 'THE ANSWER WILL APPEAR HERE';
      displayHint.textContent = 'READY WHEN YOU ARE';
      playTone(420);
    } else if (button.dataset.action === 'delete') {
      const start = expressionInput.selectionStart;
      const end = expressionInput.selectionEnd;
      if (start !== end) {
        expressionInput.setRangeText('', start, end, 'end');
      } else if (start > 0) {
        expressionInput.setRangeText('', start - 1, start, 'end');
      }
      expressionInput.focus();
      playTone(380);
    } else if (button.dataset.action === 'calculate') {
      beginCalculation();
    } else if (button.dataset.value) {
      const start = expressionInput.selectionStart;
      const end = expressionInput.selectionEnd;
      expressionInput.setRangeText(button.dataset.value, start, end, 'end');
      expressionInput.focus();
      playTone(520);
    }
  });

  expressionInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      beginCalculation();
    } else if (event.key === 'Escape') {
      setExpressionValue('');
    }
  });

  document.getElementById('complicate-button').addEventListener('click', () => {
    const expression = expressionInput.value.trim();
    if (!expression) {
      showToast('Enter an equation first. We need something to overcomplicate.');
      return;
    }
    try {
      evaluateExpression(expression);
      setExpressionValue(`(${expression}) * 1 + 0`);
      showToast('Added two unnecessary operations. The result remains emotionally unchanged.');
      playTone(610);
    } catch (error) {
      showToast(error.message);
    }
  });

  userDetailsForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(userDetailsForm);
    const profile = {
      fullName: String(formData.get('fullName') || '').trim(),
      email: String(formData.get('email') || '').trim(),
      college: String(formData.get('college') || '').trim(),
      major: String(formData.get('major') || '').trim(),
      graduationYear: String(formData.get('graduationYear') || '').trim(),
      excuse: String(formData.get('excuse') || '').trim()
    };

    if (!profile.fullName || !profile.email || !profile.college || !profile.major || !profile.graduationYear || !profile.excuse) {
      showToast('Every detail is required before we can allow a result.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(profile.email)) {
      showToast('That email address appears to be stylishly invalid.');
      return;
    }

    saveUserProfile(profile);
    detailsOverlay.classList.add('hidden');
    showToast(`Profile locked in for ${profile.fullName}. The paperwork is now complete.`);
    playTone(720);
  });

  document.getElementById('close-details').addEventListener('click', () => {
    detailsOverlay.classList.add('hidden');
    showToast('Your profile is required before the calculator can proceed.');
  });

  document.getElementById('duration').addEventListener('input', (event) => {
    const duration = `${event.target.value}s`;
    document.getElementById('duration-value').textContent = duration;
    document.getElementById('drama-stat').textContent = duration;
  });

  document.getElementById('genius-toggle').addEventListener('click', (event) => {
    state.geniusMode = !state.geniusMode;
    event.currentTarget.setAttribute('aria-pressed', String(state.geniusMode));
    document.getElementById('genius-status').textContent = state.geniusMode ? 'ON' : 'OFF';
    event.currentTarget.title = state.geniusMode ? 'Questions and verification skipped; loading lasts under half a second.' : 'Skip the paperwork with Genius Mode.';
    showToast(state.geniusMode ? 'Genius Mode enabled. Bureaucracy has been intimidated.' : 'Genius Mode disabled. Prepare for paperwork.');
    playTone(state.geniusMode ? 820 : 440);
  });

  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    updateThemeButton();
    saveState(getHistory());
  });

  document.getElementById('sound-toggle').addEventListener('click', () => {
    state.muted = !state.muted;
    updateSoundButton();
    saveState(getHistory());
    if (!state.muted) playTone(700);
    showToast(state.muted ? 'Sound effects muted.' : 'Sound effects restored.');
  });

  document.getElementById('explain-button').addEventListener('click', () => {
    document.getElementById('explanation-overlay').classList.remove('hidden');
    playTone(560);
  });
  function closeExplanation() {
    document.getElementById('explanation-overlay').classList.add('hidden');
  }
  document.getElementById('close-explanation').addEventListener('click', closeExplanation);
  document.getElementById('close-explanation-button').addEventListener('click', closeExplanation);
  document.getElementById('close-flow').addEventListener('click', closeFlow);
  document.getElementById('clear-history').addEventListener('click', () => {
    renderHistory([]);
    saveState([]);
    showToast('History cleared. The evidence has been professionally misplaced.');
  });

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeFlow();
  });
  detailsOverlay.addEventListener('click', (event) => {
    if (event.target === detailsOverlay) {
      detailsOverlay.classList.add('hidden');
      showToast('Your profile is required before the calculator can proceed.');
    }
  });
  document.getElementById('explanation-overlay').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeExplanation();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeFlow();
      closeExplanation();
      if (!state.userProfile) detailsOverlay.classList.remove('hidden');
    }
  });
  window.setInterval(updateScore, 1000);
  readSavedState();
  if (!state.userProfile) {
    detailsOverlay.classList.remove('hidden');
  }
})();
