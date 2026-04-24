(function () {
  'use strict';

  var base = location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  var QUESTION_URL = base + 'data/umbrella-questions.json';

  var CHARS = {
    chris: {
      name: 'Chris Redfield',
      role: 'S.T.A.R.S. Alpha — Marksman / B.S.A.A.',
      clearance: 'ALPHA',
      color: '#4a9fd4',
      bio: 'Direct, loyal, and protective profile. During a biological outbreak, you tend to enter danger first and bring the team out alive.'
    },
    jill: {
      name: 'Jill Valentine',
      role: 'S.T.A.R.S. Alpha — Field Agent / B.S.A.A.',
      clearance: 'OMEGA',
      color: '#d465a0',
      bio: 'Strategic and resilient profile. You notice escape routes, manage resources, and turn panic into a survival plan.'
    },
    leon: {
      name: 'Leon S. Kennedy',
      role: 'U.S. Government — Field Operative',
      clearance: 'DELTA',
      color: '#6fb56f',
      bio: 'Adaptable profile with strong pressure control. You protect others while improvising when the original plan collapses.'
    },
    claire: {
      name: 'Claire Redfield',
      role: 'TerraSave — Field Investigator',
      clearance: 'GAMMA',
      color: '#d47a40',
      bio: 'Empathetic and courageous profile. Your priority remains saving vulnerable people, even when the situation becomes impossible.'
    },
    wesker: {
      name: 'Albert Wesker',
      role: 'Umbrella Corp. — Director / Antagonist',
      clearance: 'CLASSIFIED',
      color: '#aaaaaa',
      bio: 'Control, dominance, and experimentation profile. The system detects high ambition, extreme ethical risk, and betrayal potential.'
    }
  };

  var RULES = {
    name: {
      label: 'Full Legal Name',
      required: true,
      minLen: 2,
      maxLen: 60,
      pattern: /^[a-zA-ZÀ-ÿ\s'\-]+$/,
      help: 'Only letters, spaces, apostrophes, and hyphens are allowed. Example: Jill Valentine.'
    },
    codename: {
      label: 'Field Codename',
      required: true,
      minLen: 2,
      maxLen: 30,
      pattern: /^[a-zA-Z0-9_\-\s]+$/,
      help: 'The codename may contain letters, numbers, spaces, underscores, and hyphens. Example: STAR-JILL.'
    },
    email: {
      label: 'Secure Communication Channel',
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      help: 'The email must use a valid format, for example operative@umbrella-corp.net.'
    },
    weapon: {
      label: 'Primary Weapon of Choice',
      required: true,
      help: 'Select your primary weapon. This choice influences the resulting archive profile.'
    },
    instinct: {
      label: 'Threat Response — First Instinct',
      required: true,
      help: 'Select your first response to a threat. This changes the profile score.'
    },
    favGame: {
      label: 'Field Experience — Favourite Entry',
      required: true,
      help: 'Select the incident you study most closely. The answer helps determine thematic experience.'
    },
    priority: {
      label: 'Operative Priority Under Crisis',
      required: true,
      help: 'Select your crisis priority. Protection, evidence, survival, or experimentation points to different profiles.'
    },
    message: {
      label: 'Field Report / Additional Intel',
      required: false,
      maxLen: 800,
      help: 'Optional report. If completed, it must not exceed 800 characters.'
    }
  };

  var quizState = {
    bank: null,
    asked: [],
    current: null,
    difficulty: 'medium',
    score: 0,
    total: 0,
    max: 5,
    completed: false
  };

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    });
  }

  function fieldElement(id) {
    return document.getElementById(id) || document.getElementById(id + '-group');
  }

  function fieldValue(id) {
    if (id === 'instinct' || id === 'priority') {
      var checked = document.querySelector('[name="' + id + '"]:checked');
      return checked ? checked.value : '';
    }
    var el = document.getElementById(id);
    return el ? String(el.value || '').trim() : '';
  }

  function collectData() {
    return {
      name: fieldValue('name'),
      codename: fieldValue('codename'),
      email: fieldValue('email'),
      weapon: fieldValue('weapon'),
      instinct: fieldValue('instinct'),
      priority: fieldValue('priority'),
      favGame: fieldValue('favGame'),
      message: fieldValue('message')
    };
  }

  function validateField(id, value) {
    var rule = RULES[id];
    value = String(value == null ? '' : value).trim();
    if (!rule) return null;
    if (rule.required && !value) return 'Required field. ' + rule.help;
    if (!value) return null;
    if (rule.minLen && value.length < rule.minLen) return 'Minimum ' + rule.minLen + ' characters. ' + rule.help;
    if (rule.maxLen && value.length > rule.maxLen) return 'Maximum ' + rule.maxLen + ' characters. ' + rule.help;
    if (rule.pattern && !rule.pattern.test(value)) return 'Invalid format. ' + rule.help;
    return null;
  }

  function validateAll(data) {
    var errors = {};
    Object.keys(RULES).forEach(function (id) {
      var err = validateField(id, data[id]);
      if (err) errors[id] = err;
    });
    return errors;
  }

  function ensureFeedbackSlot(id) {
    var group = fieldElement(id);
    if (!group) return null;
    var fg = group.classList.contains('field-group') ? group : group.closest('.field-group');
    if (!fg) return null;
    var slot = fg.querySelector('[data-live-feedback="' + id + '"]');
    if (!slot) {
      slot = document.createElement('div');
      slot.className = 'ajax-field-feedback';
      slot.setAttribute('data-live-feedback', id);
      fg.appendChild(slot);
    }
    return slot;
  }

  function setFieldState(id, err, touched) {
    var el = fieldElement(id);
    var msg = document.getElementById(id + '-error');
    var slot = ensureFeedbackSlot(id);
    var ok = !err && !!fieldValue(id);
    if (el) {
      el.classList.toggle('field-error', !!err);
      el.classList.toggle('field-ok', ok);
    }
    if (msg) msg.textContent = err ? ('⚠ ' + err) : '';
    if (slot) {
      if (err) {
        slot.className = 'ajax-field-feedback bad';
        slot.innerHTML = '<strong>Incorrect / incomplete:</strong> ' + esc(err);
      } else if (ok) {
        slot.className = 'ajax-field-feedback good';
        slot.innerHTML = '<strong>Correct:</strong> ' + esc(RULES[id].help);
      } else if (touched) {
        slot.className = 'ajax-field-feedback warn';
        slot.innerHTML = '<strong>Required:</strong> ' + esc(RULES[id].help);
      }
    }
  }

  function clearSubmitStates() {
    document.querySelectorAll('.field-error,.field-ok').forEach(function (el) {
      el.classList.remove('field-error', 'field-ok');
    });
  }

  function matchCharacter(data) {
    var score = 0;
    var wp = { knife: -1, handgun: 1, shotgun: 2, smg: 2, rocket: 3, bowgun: 0 };
    var ip = { fight: 2, stealth: -1, run: 0, dominate: 4 };
    var pp = { protect: 1, intel: -1, survive: 0, dominate: 5 };
    var gp = { re1: 0, leon: 0, re3: -1, re4: 1, re7: -2, re8: 0 };
    score += wp[data.weapon] || 0;
    score += ip[data.instinct] || 0;
    score += pp[data.priority] || 0;
    score += gp[data.favGame] || 0;
    score += Math.min(3, quizState.score);
    if (score >= 10) return CHARS.wesker;
    if (score >= 5) return CHARS.chris;
    if (score >= 3) return CHARS.leon;
    if (score >= 0) return CHARS.claire;
    return CHARS.jill;
  }

  function typewrite(el, text, speed) {
    el.textContent = '';
    var i = 0;
    var iv = setInterval(function () {
      el.textContent += text[i++] || '';
      if (i >= text.length) clearInterval(iv);
    }, speed || 14);
  }

  function scoreComment(percent) {
    if (percent < 35) return 'High risk: corrections are required before transmission.';
    if (percent < 70) return 'Partially stable profile: complete the remaining fields and verify the answers.';
    if (percent < 100) return 'Clearance almost valid: a few checks remain.';
    return 'Valid clearance: the assessment can be evaluated.';
  }

  function initScorePanel(form) {
    var panel = document.createElement('div');
    panel.id = 'ajax-live-score-panel';
    panel.className = 'ajax-live-score-panel';
    panel.innerHTML = [
      '<div><span>// Live Assessment Score</span><strong id="ajax-live-score">0/0</strong></div>',
      '<p id="ajax-live-comment">Complete the fields for live validation.</p>',
      '<div id="ajax-field-mini-list" class="ajax-field-mini-list"></div>'
    ].join('');
    var progress = document.querySelector('.progress-wrapper');
    if (progress) progress.insertAdjacentElement('afterend', panel);
    else form.parentNode.insertBefore(panel, form);
  }

  function updateLiveScore() {
    var ids = Object.keys(RULES).filter(function (id) { return id !== 'message'; });
    var valid = 0;
    var mini = [];
    ids.forEach(function (id) {
      var value = fieldValue(id);
      var err = validateField(id, value);
      if (value && !err) valid++;
      mini.push('<span class="' + (value && !err ? 'ok' : value ? 'bad' : 'empty') + '">' + esc(RULES[id].label) + '</span>');
    });
    var quizBonus = quizState.total ? Math.round((quizState.score / quizState.total) * 100) : 0;
    var percent = Math.round((valid / ids.length) * 100);
    var score = document.getElementById('ajax-live-score');
    var comment = document.getElementById('ajax-live-comment');
    var miniList = document.getElementById('ajax-field-mini-list');
    if (score) score.textContent = valid + '/' + ids.length + ' + quiz ' + quizBonus + '%';
    if (comment) comment.textContent = scoreComment(percent);
    if (miniList) miniList.innerHTML = mini.join('');
  }

  function initProgress() {
    var bar = document.getElementById('form-progress-bar');
    var pct = document.getElementById('form-progress-pct');
    var form = document.getElementById('umbrella-form');
    if (!bar || !form) return;
    var fields = ['name', 'codename', 'email', 'weapon', 'instinct', 'priority', 'favGame'];
    function update() {
      var filled = fields.filter(function (id) { return !!fieldValue(id); }).length;
      var p = Math.round(filled / fields.length * 100);
      bar.style.width = p + '%';
      bar.style.background = p < 40 ? '#3a0000' : p < 80 ? '#8b0000' : '#1a7a1a';
      if (pct) pct.textContent = p + '%';
      updateLiveScore();
    }
    form.addEventListener('input', update);
    form.addEventListener('change', update);
    update();
  }

  function renderRetryPanel(errors) {
    var panel = document.getElementById('ajax-retry-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'ajax-retry-panel';
      panel.className = 'ajax-retry-panel';
      var form = document.getElementById('umbrella-form');
      form.insertAdjacentElement('afterend', panel);
    }
    var keys = Object.keys(errors);
    if (!keys.length) {
      panel.innerHTML = '';
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';
    panel.innerHTML = [
      '<div class="ajax-mini-tag">// RETRY REQUIRED</div>',
      '<h3>Fields to Review</h3>',
      '<p>Correct only the fields below. The assessment repeats until every required field becomes valid.</p>',
      '<div class="ajax-retry-list">',
        keys.map(function (id) {
          return '<button type="button" data-focus-field="' + esc(id) + '"><strong>' + esc(RULES[id].label) + '</strong><span>' + esc(errors[id]) + '</span></button>';
        }).join(''),
      '</div>'
    ].join('');
    panel.querySelectorAll('[data-focus-field]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.dataset.focusField;
        var el = document.getElementById(id) || document.querySelector('[name="' + id + '"]');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(function () { try { el.focus(); } catch (e) {} }, 300);
        }
      });
    });
  }

  function renderResult(data, ch) {
    var panel = document.getElementById('result-panel');
    if (!panel) return;
    var quizText = quizState.total
      ? quizState.score + '/' + quizState.total + ' correct answers in the adaptive knowledge test'
      : 'The adaptive knowledge test was not completed';
    panel.innerHTML = [
      '<div class="result-header">',
        '<div class="result-tag">// Umbrella Corp — Assessment Report Complete</div>',
        '<div class="result-clearance" style="color:' + esc(ch.color) + '">CLEARANCE LEVEL: ' + esc(ch.clearance) + '</div>',
      '</div>',
      '<div class="result-sep"></div>',
      '<div class="result-body">',
        '<div><div class="result-label">Operative Codename</div><div class="result-codename">' + esc(data.codename.toUpperCase()) + '</div></div>',
        '<div><div class="result-label">Archive Match</div><div class="result-charname" style="color:' + esc(ch.color) + '">' + esc(ch.name) + '</div><div class="result-charrole">' + esc(ch.role) + '</div></div>',
      '</div>',
      '<div class="result-sep"></div>',
      '<div><div class="result-label">Knowledge Test Result</div><p class="result-intel">' + esc(quizText) + '</p></div>',
      '<div class="result-sep"></div>',
      '<div><div class="result-label">Psychological Profile</div><p id="result-bio" class="result-bio"></p></div>',
      data.message ? '<div class="result-sep"></div><div><div class="result-label">Field Report</div><p class="result-intel">' + esc(data.message) + '</p></div>' : '',
      '<div class="result-sep"></div>',
      '<div class="result-tag">Transmission status: <span style="color:#22ff22">ACTIVE</span></div>'
    ].join('');
    panel.style.cssText = 'display:block;opacity:0;transform:translateY(18px);transition:opacity 0.5s ease,transform 0.5s ease;';
    requestAnimationFrame(function () {
      panel.style.opacity = '1';
      panel.style.transform = 'translateY(0)';
    });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var bioEl = document.getElementById('result-bio');
    if (bioEl) typewrite(bioEl, ch.bio, 14);
  }

  function insertQuizModule(form) {
    var wrapper = document.createElement('div');
    wrapper.id = 'ajax-quiz-module';
    wrapper.className = 'ajax-quiz-module';
    wrapper.innerHTML = [
      '<div class="form-module-title">Module 03B — Adaptive Knowledge Test</div>',
      '<div class="field-group">',
        '<label class="field-label">Resident Evil Archive Questions</label>',
        '<span class="field-hint">// Questions appear one by one. A correct answer raises the difficulty; an incorrect answer lowers it.</span>',
        '<div id="ajax-question-card" class="ajax-question-card">Loading archive questions...</div>',
        '<div id="ajax-question-feedback" class="ajax-question-feedback"></div>',
      '</div>'
    ].join('');
    var intel = document.getElementById('module-intel');
    form.insertBefore(wrapper, intel || form.querySelector('.form-submit-row'));
  }

  function allQuestions() {
    if (!quizState.bank) return [];
    return [].concat(quizState.bank.easy || [], quizState.bank.medium || [], quizState.bank.hard || []);
  }

  function pickQuestion() {
    var bank = quizState.bank || {};
    var pool = (bank[quizState.difficulty] || []).filter(function (q) {
      return quizState.asked.indexOf(q.id) === -1;
    });
    if (!pool.length) {
      pool = allQuestions().filter(function (q) { return quizState.asked.indexOf(q.id) === -1; });
    }
    if (!pool.length || quizState.total >= quizState.max) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function renderQuestion() {
    var card = document.getElementById('ajax-question-card');
    var feedback = document.getElementById('ajax-question-feedback');
    if (!card) return;
    if (quizState.total >= quizState.max) {
      quizState.completed = true;
      card.innerHTML = [
        '<div class="ajax-mini-tag">// KNOWLEDGE TEST COMPLETE</div>',
        '<h3>Module Complete</h3>',
        '<p>Question score: <strong>' + quizState.score + '/' + quizState.total + '</strong>. You may submit the assessment or continue correcting any marked fields.</p>'
      ].join('');
      if (feedback) feedback.innerHTML = '';
      updateLiveScore();
      return;
    }
    var q = pickQuestion();
    if (!q) return;
    quizState.current = q;
    quizState.asked.push(q.id);
    card.innerHTML = [
      '<div class="ajax-mini-tag">// Difficulty: ' + esc(quizState.difficulty.toUpperCase()) + ' — Question ' + (quizState.total + 1) + '/' + quizState.max + '</div>',
      '<h3>' + esc(q.question) + '</h3>',
      '<div class="ajax-answer-list">',
        q.options.map(function (opt) { return '<button type="button" data-answer="' + esc(opt) + '">' + esc(opt) + '</button>'; }).join(''),
      '</div>'
    ].join('');
    if (feedback) feedback.innerHTML = '';
  }

  function handleAnswer(answer) {
    var q = quizState.current;
    var feedback = document.getElementById('ajax-question-feedback');
    if (!q || !feedback) return;
    var correct = answer === q.answer;
    quizState.total++;
    if (correct) quizState.score++;
    quizState.difficulty = correct ? 'hard' : 'easy';
    feedback.className = 'ajax-question-feedback ' + (correct ? 'good' : 'bad');
    feedback.innerHTML = [
      '<strong>' + (correct ? 'Correct.' : 'Incorrect.') + '</strong> ',
      esc(q.explanation),
      '<br><span>The next question will be ' + (correct ? 'more difficult' : 'simpler') + '.</span>'
    ].join('');
    document.querySelectorAll('#ajax-question-card [data-answer]').forEach(function (btn) {
      btn.disabled = true;
      btn.classList.toggle('correct', btn.dataset.answer === q.answer);
      btn.classList.toggle('wrong', btn.dataset.answer === answer && !correct);
    });
    updateLiveScore();
    setTimeout(renderQuestion, 1100);
  }

  function initQuiz(form) {
    insertQuizModule(form);
    var card = document.getElementById('ajax-question-card');
    if (!card) return;
    card.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-answer]');
      if (btn && !btn.disabled) handleAnswer(btn.dataset.answer);
    });
    fetchJSON(QUESTION_URL)
      .then(function (bank) {
        quizState.bank = bank;
        renderQuestion();
      })
      .catch(function () {
        card.innerHTML = '<p class="ajax-status ajax-status-error">Questions could not be loaded. Start the project through a local server so the browser can read the JSON files.</p>';
      });
  }

  function bindImmediateValidation(form) {
    Object.keys(RULES).forEach(function (id) {
      ensureFeedbackSlot(id);
      var handler = function () {
        var err = validateField(id, fieldValue(id));
        setFieldState(id, err, true);
        updateLiveScore();
      };
      if (id === 'instinct' || id === 'priority') {
        document.querySelectorAll('[name="' + id + '"]').forEach(function (el) {
          el.addEventListener('change', handler);
        });
      } else {
        var el = document.getElementById(id);
        if (el) {
          el.addEventListener('input', handler);
          el.addEventListener('blur', handler);
          el.addEventListener('change', handler);
        }
      }
    });
  }

  function initForm() {
    var form = document.getElementById('umbrella-form');
    if (!form) return;
    initScorePanel(form);
    bindImmediateValidation(form);
    initProgress();
    initQuiz(form);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearSubmitStates();
      var data = collectData();
      var errors = validateAll(data);
      Object.keys(RULES).forEach(function (id) {
        setFieldState(id, errors[id] || null, true);
      });
      renderRetryPanel(errors);
      updateLiveScore();
      if (Object.keys(errors).length) {
        var firstId = Object.keys(errors)[0];
        var first = document.getElementById(firstId) || document.querySelector('[name="' + firstId + '"]');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      var btn = form.querySelector('.btn-submit');
      if (btn) {
        btn.textContent = '// ASSESSMENT COMPLETE';
        setTimeout(function () { btn.textContent = '// Submit Assessment'; }, 1400);
      }
      renderResult(data, matchCharacter(data));
      return false;
    });
  }

  ready(initForm);
}());
