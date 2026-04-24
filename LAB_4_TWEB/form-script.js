

(function () {
  'use strict';

  
  var CHARS = {
    chris: {
      name: 'Chris Redfield',
      role: 'S.T.A.R.S. Alpha — Marksman / B.S.A.A.',
      clearance: 'ALPHA',
      color: '#4a9fd4',
      bio: 'Headstrong, loyal, physically overwhelming. You face threats head-on '
         + 'and refuse to leave anyone behind. Your determination borders on recklessness — '
         + 'but it keeps working. Boulder optional.'
    },
    jill: {
      name: 'Jill Valentine',
      role: 'S.T.A.R.S. Alpha — Field Agent / B.S.A.A.',
      clearance: 'OMEGA',
      color: '#d465a0',
      bio: 'Strategic, resourceful, unbreakable. You plan your way out before anyone '
         + 'realises there\'s no exit. Master of unlocking. Master of survival. '
         + 'Nemesis has tried — and failed.'
    },
    leon: {
      name: 'Leon S. Kennedy',
      role: 'U.S. Government — Field Operative',
      clearance: 'DELTA',
      color: '#6fb56f',
      bio: 'Composed under fire, with hair that defies physics and a philosophical '
         + 'one-liner for every occasion. You were not prepared — and you survived anyway. '
         + 'The President\'s daughter is safe.'
    },
    claire: {
      name: 'Claire Redfield',
      role: 'TerraSave — Field Investigator',
      clearance: 'GAMMA',
      color: '#d47a40',
      bio: 'You rode into danger looking for someone you love and left with the whole city '
         + 'on your conscience. Protective, relentless, and surprisingly effective on a '
         + 'motorbike through a zombie apocalypse.'
    },
    wesker: {
      name: 'Albert Wesker',
      role: 'Umbrella Corp. — Director / Antagonist',
      clearance: 'CLASSIFIED',
      color: '#aaaaaa',
      bio: 'You possess extraordinary vision and extraordinary contempt for everyone around you. '
         + 'Sunglasses indoors. Prototype virus for personal gain. You see the board before '
         + 'anyone else knows there\'s a game. Dangerous. Exceptional. Inevitable.'
    }
  };

  
  function matchCharacter(data) {
    var score = 0;

    var wp = { knife: -1, handgun: 1, shotgun: 2, smg: 2, rocket: 3, bowgun: 0 };
    score += wp[data.weapon] || 0;

    var ip = { fight: 2, stealth: -1, run: 0, dominate: 4 };
    score += ip[data.instinct] || 0;

    var pp = { protect: 1, intel: -1, survive: 0, dominate: 5 };
    score += pp[data.priority] || 0;

    var gp = { re1: 0, re2: 0, re3: -1, re4: 1, re7: -2, re8: 0 };
    score += gp[data.favGame] || 0;

    if (score >= 9)  return CHARS.wesker;
    if (score >= 4)  return CHARS.chris;
    if (score >= 2)  return CHARS.leon;
    if (score >= 0)  return CHARS.claire;
    return CHARS.jill;
  }

  
  var RULES = {
    name:     { required: true,  minLen: 2, maxLen: 60,  pattern: /^[a-zA-ZÀ-ÿ\s'\-]+$/ },
    codename: { required: true,  minLen: 2, maxLen: 30,  pattern: /^[a-zA-Z0-9_\-\s]+$/ },
    email:    { required: true,  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    weapon:   { required: true  },
    instinct: { required: true  },
    priority: { required: true  },
    favGame:  { required: true  },
    message:  { required: false, maxLen: 800 }
  };

  function validate(data) {
    var errors = {};
    Object.keys(RULES).forEach(function (field) {
      var rule = RULES[field];
      var val  = (data[field] || '').trim();

      if (rule.required && !val) { errors[field] = 'Câmp obligatoriu.'; return; }
      if (!val) return;
      if (rule.minLen && val.length < rule.minLen) { errors[field] = 'Minim ' + rule.minLen + ' caractere.'; return; }
      if (rule.maxLen && val.length > rule.maxLen) { errors[field] = 'Maxim ' + rule.maxLen + ' caractere.'; return; }
      if (rule.pattern && !rule.pattern.test(val)) { errors[field] = 'Format invalid.'; }
    });
    return errors;
  }

  
  function setField(id, err) {
    var el  = document.getElementById(id);
    var msg = document.getElementById(id + '-error');
    if (!el) return;
    el.classList.toggle('field-error', !!err);
    el.classList.toggle('field-ok',    !err);
    if (msg) msg.textContent = err ? ('⚠ ' + err) : '';
  }

  function clearAll() {
    document.querySelectorAll('.field-error,.field-ok').forEach(function (el) {
      el.classList.remove('field-error', 'field-ok');
    });
    document.querySelectorAll('.field-err-msg').forEach(function (el) {
      el.textContent = '';
    });
  }

  
  function typewrite(el, text, speed) {
    el.textContent = '';
    var i = 0;
    var iv = setInterval(function () {
      el.textContent += text[i++];
      if (i >= text.length) clearInterval(iv);
    }, speed);
  }

  
  function esc(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  
  function renderResult(data, ch) {
    var panel = document.getElementById('result-panel');
    if (!panel) return;

    panel.innerHTML = [
      '<div class="result-header">',
        '<div class="result-tag">// Umbrella Corp — Assessment Report — Complete</div>',
        '<div class="result-clearance" style="color:' + ch.color + '">',
          'CLEARANCE LEVEL: ' + ch.clearance,
        '</div>',
      '</div>',
      '<div class="result-sep"></div>',
      '<div class="result-body">',
        '<div>',
          '<div class="result-label">Operative Codename</div>',
          '<div class="result-codename">' + esc(data.codename.toUpperCase()) + '</div>',
        '</div>',
        '<div>',
          '<div class="result-label">Archive Match</div>',
          '<div class="result-charname" style="color:' + ch.color + '">' + ch.name + '</div>',
          '<div class="result-charrole">' + ch.role + '</div>',
        '</div>',
      '</div>',
      '<div class="result-sep"></div>',
      '<div>',
        '<div class="result-label">// Profil psihologic</div>',
        '<p id="result-bio" class="result-bio"></p>',
      '</div>',
      data.message ? [
        '<div class="result-sep"></div>',
        '<div>',
          '<div class="result-label">// Your Field Report</div>',
          '<p class="result-intel">' + esc(data.message) + '</p>',
        '</div>'
      ].join('') : '',
      '<div class="result-sep"></div>',
      '<div class="result-tag">Transmission status: <span style="color:#22ff22">ACTIVE</span></div>'
    ].join('');

    panel.style.cssText = 'display:block;opacity:0;transform:translateY(18px);transition:opacity 0.5s ease,transform 0.5s ease;';
    requestAnimationFrame(function () {
      panel.style.opacity   = '1';
      panel.style.transform = 'translateY(0)';
    });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

    var bioEl = document.getElementById('result-bio');
    if (bioEl) typewrite(bioEl, ch.bio, 16);
  }

  
  function initProgress() {
    var bar   = document.getElementById('form-progress-bar');
    var pct   = document.getElementById('form-progress-pct');
    var form  = document.getElementById('umbrella-form');
    if (!bar || !form) return;

    var fields = ['name','codename','email','weapon','instinct','priority','favGame'];

    function update() {
      var filled = 0;
      fields.forEach(function (id) {
        var el = document.getElementById(id) || document.querySelector('[name="' + id + '"]:checked');
        if (el && el.value && el.value.trim()) filled++;
      });
      var p = Math.round(filled / fields.length * 100);
      bar.style.width = p + '%';
      bar.style.background = p < 40 ? '#3a0000' : p < 80 ? '#8b0000' : '#cc1111';
      if (pct) pct.textContent = p + '%';
    }

    form.addEventListener('input',  update);
    form.addEventListener('change', update);
    update();
  }

  
  function initForm() {
    var form = document.getElementById('umbrella-form');
    if (!form) return;

    
    ['name','codename','email'].forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () {
        var errs = validate({ [id]: el.value });
        setField(id, errs[id] || null);
      });
    });

    
    form.addEventListener('submit', function (e) {
      clearAll();

      var data = {
        name:     (document.getElementById('name')    || {}).value    || '',
        codename: (document.getElementById('codename')|| {}).value    || '',
        email:    (document.getElementById('email')   || {}).value    || '',
        weapon:   (document.getElementById('weapon')  || {}).value    || '',
        instinct: (document.querySelector('[name="instinct"]:checked') || {}).value || '',
        priority: (document.querySelector('[name="priority"]:checked') || {}).value || '',
        favGame:  (document.getElementById('favGame') || {}).value    || '',
        message:  (document.getElementById('message') || {}).value    || ''
      };
      Object.keys(data).forEach(function(k){ if(typeof data[k]==='string') data[k]=data[k].trim(); });

      var errors = validate(data);

      if (Object.keys(errors).length) {
        e.preventDefault();
        Object.keys(errors).forEach(function (id) { setField(id, errors[id]); });
        var first = form.querySelector('.field-error');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }

      var btn = form.querySelector('.btn-submit');
      if (btn) {
        btn.textContent = '// SE TRIMITE CĂTRE SERVER...';
        btn.disabled = true;
      }
      return true;
    });
  }

  
  function init() { initForm(); initProgress(); }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();

}());
