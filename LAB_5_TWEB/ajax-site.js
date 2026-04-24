(function () {
  'use strict';

  var base = location.pathname.indexOf('/pages/') !== -1 ? '../' : '';
  var DATA_URL = base + 'data/resident-evil-ajax.json';

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function fetchJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function archivePanel(title, subtitle, body) {
    return [
      '<section class="ajax-section">',
        '<div class="ajax-heading">',
          '<div class="ajax-mini-tag">// LIVE ARCHIVE</div>',
          '<h2>' + esc(title) + '</h2>',
          subtitle ? '<p>' + esc(subtitle) + '</p>' : '',
        '</div>',
        body,
      '</section>'
    ].join('');
  }

  function statusLine(text, type) {
    return '<div class="ajax-status ajax-status-' + esc(type || 'info') + '">' + esc(text) + '</div>';
  }

  function insertAfter(selector, html) {
    var el = document.querySelector(selector);
    if (el) el.insertAdjacentHTML('afterend', html);
  }

  function renderInfoBox(item, extraClass) {
    if (!item) return '';
    return [
      '<article class="ajax-info-box ' + esc(extraClass || '') + '">',
        '<div class="ajax-info-kicker">' + esc(item.year || item.type || item.role || 'Archive record') + '</div>',
        '<h3>' + esc(item.title || item.name) + '</h3>',
        '<p>' + esc(item.description || item.body || '') + '</p>',
      '</article>'
    ].join('');
  }

  function initContentSwitcher(data, root) {
    var keys = Object.keys(data.siteText || {});
    var out = root.querySelector('[data-ajax-output="site-text"]');
    var buttons = root.querySelector('[data-ajax-buttons="site-text"]');
    if (!out || !buttons || !keys.length) return;

    buttons.innerHTML = keys.map(function (key, index) {
      return '<button type="button" class="ajax-chip' + (index === 0 ? ' active' : '') + '" data-site-key="' + esc(key) + '">' + esc(key) + '</button>';
    }).join('');

    function show(key) {
      var item = data.siteText[key];
      out.innerHTML = renderInfoBox(item);
      buttons.querySelectorAll('.ajax-chip').forEach(function (b) {
        b.classList.toggle('active', b.dataset.siteKey === key);
      });
    }

    buttons.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-site-key]');
      if (!btn) return;
      show(btn.dataset.siteKey);
    });
    show(keys[0]);
  }

  function initLocationSelect(data, root) {
    var select = root.querySelector('[data-ajax-select="locations"]');
    var out = root.querySelector('[data-ajax-output="locations"]');
    if (!select || !out) return;
    select.innerHTML = '<option value="">-- Select location --</option>' + data.locations.map(function (x) {
      return '<option value="' + esc(x.id) + '">' + esc(x.name) + '</option>';
    }).join('');
    select.addEventListener('change', function () {
      var item = data.locations.find(function (x) { return x.id === select.value; });
      out.innerHTML = item ? renderInfoBox(item) : statusLine('Select a location to load its archive entry.', 'info');
    });
    out.innerHTML = statusLine('Location intelligence appears here without reloading the page.', 'info');
  }

  function initImageDescriptions(data, root, relativePrefix) {
    var box = root.querySelector('[data-ajax-gallery]');
    if (!box) return;
    var prefix = relativePrefix || base;
    box.innerHTML = data.images.map(function (x, index) {
      return [
        '<button type="button" class="ajax-image-card" data-img-index="' + index + '">',
          '<img src="' + esc(prefix + 'images/' + x.image) + '" alt="' + esc(x.title) + '">',
          '<span>' + esc(x.title) + '</span>',
        '</button>'
      ].join('');
    }).join('');

    var out = root.querySelector('[data-ajax-output="images"]');
    if (!out) return;
    box.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-img-index]');
      if (!btn) return;
      var item = data.images[Number(btn.dataset.imgIndex)];
      box.querySelectorAll('.ajax-image-card').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      out.innerHTML = renderInfoBox({ title: item.title, type: 'Archive image', description: item.description });
    });
    out.innerHTML = statusLine('Select an image to reveal its archive description.', 'info');
  }

  function initBanner(data, root) {
    var banner = root.querySelector('[data-ajax-banner]');
    if (!banner) return;
    var items = data.banner || [];
    var i = Math.floor(Math.random() * items.length);
    function show() {
      var item = items[i % items.length];
      banner.innerHTML = [
        '<div class="ajax-banner-img"><img src="' + esc(base + item.image) + '" alt="' + esc(item.title) + '"></div>',
        '<div class="ajax-banner-text">',
          '<div class="ajax-mini-tag">// ROTATING ARCHIVE FILE</div>',
          '<h3>' + esc(item.title) + '</h3>',
          '<p>' + esc(item.text) + '</p>',
        '</div>'
      ].join('');
      i = (i + 1) % items.length;
    }
    show();
    setInterval(show, 4500);
  }

  function buildMap(mapItems) {
    return [
      '<div class="ajax-map-grid">',
        mapItems.map(function (x) {
          return '<button type="button" class="ajax-map-zone" data-map-zone="' + esc(x.id) + '">' + esc(x.label) + '</button>';
        }).join(''),
      '</div>',
      '<div class="ajax-map-output" data-ajax-map-output>',
        statusLine('Move the mouse over a zone or select it to view its description.', 'info'),
      '</div>'
    ].join('');
  }

  function initMap(root, mapItems, outputSelector) {
    var output = root.querySelector(outputSelector || '[data-ajax-map-output]');
    if (!output || !mapItems) return;
    root.querySelectorAll('[data-map-zone]').forEach(function (btn) {
      var update = function () {
        var item = mapItems.find(function (x) { return x.id === btn.dataset.mapZone; });
        if (item) output.innerHTML = renderInfoBox(item, 'map-result');
      };
      btn.addEventListener('mouseenter', update);
      btn.addEventListener('focus', update);
      btn.addEventListener('click', update);
    });
  }

  function initCharacterTable(data, root) {
    var table = root.querySelector('[data-ajax-character-table]');
    var out = root.querySelector('[data-ajax-output="character-table"]');
    if (!table || !out) return;
    table.innerHTML = [
      '<table class="ajax-table">',
        '<thead><tr><th>Character</th><th>Role</th><th>Affiliation</th><th>Threat Level</th></tr></thead>',
        '<tbody>',
          data.characters.map(function (x, i) {
            return '<tr tabindex="0" data-character-index="' + i + '"><td>' + esc(x.name) + '</td><td>' + esc(x.role) + '</td><td>' + esc(x.affiliation) + '</td><td>' + esc(x.level) + '</td></tr>';
          }).join(''),
        '</tbody>',
      '</table>'
    ].join('');
    function show(row) {
      var item = data.characters[Number(row.dataset.characterIndex)];
      table.querySelectorAll('tr').forEach(function (r) { r.classList.remove('active'); });
      row.classList.add('active');
      out.innerHTML = renderInfoBox(item);
    }
    table.addEventListener('click', function (e) {
      var row = e.target.closest('[data-character-index]');
      if (row) show(row);
    });
    table.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var row = e.target.closest('[data-character-index]');
      if (row) { e.preventDefault(); show(row); }
    });
    out.innerHTML = statusLine('Select a character to display the archive profile.', 'info');
  }

  function initTimeline(data, root) {
    var list = root.querySelector('[data-ajax-years]');
    var out = root.querySelector('[data-ajax-output="timeline"]');
    if (!list || !out) return;
    list.innerHTML = data.timeline.map(function (x, i) {
      return '<button type="button" class="ajax-chip" data-year-index="' + i + '">' + esc(x.year) + '</button>';
    }).join('');
    list.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-year-index]');
      if (!btn) return;
      var item = data.timeline[Number(btn.dataset.yearIndex)];
      list.querySelectorAll('.ajax-chip').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      out.innerHTML = renderInfoBox(item);
    });
    out.innerHTML = statusLine('Choose a year to view the matching incident record.', 'info');
  }

  function initHome(data) {
    if (!/index\.html$|\/$/.test(location.pathname)) return;
    var html = archivePanel(
      'Resident Evil Interactive Archive',
      'Explore incident files, locations, character records, image descriptions, rotating case files, and an interactive world incident map.',
      [
        '<div class="ajax-grid two">',
          '<div class="ajax-card">',
            '<h3>Archive Briefing</h3>',
            '<div class="ajax-chip-row" data-ajax-buttons="site-text"></div>',
            '<div data-ajax-output="site-text"></div>',
          '</div>',
          '<div class="ajax-card">',
            '<h3>Resident Evil Locations</h3>',
            '<select class="field-input" data-ajax-select="locations"></select>',
            '<div data-ajax-output="locations"></div>',
          '</div>',
        '</div>',
        '<div class="ajax-grid two">',
          '<div class="ajax-card">',
            '<h3>Rotating Case File</h3>',
            '<div class="ajax-banner" data-ajax-banner></div>',
          '</div>',
          '<div class="ajax-card">',
            '<h3>Biological Incident Map</h3>',
            buildMap(data.maps.incidentWorld),
          '</div>',
        '</div>',
        '<div class="ajax-card">',
          '<h3>Image Archive Descriptions</h3>',
          '<div class="ajax-gallery" data-ajax-gallery></div>',
          '<div data-ajax-output="images"></div>',
        '</div>'
      ].join('')
    );
    insertAfter('.hero', html);
    var root = document.querySelector('.ajax-section');
    initContentSwitcher(data, root);
    initLocationSelect(data, root);
    initImageDescriptions(data, root, base);
    initBanner(data, root);
    initMap(root, data.maps.incidentWorld);
  }

  function initCharacters(data) {
    if (location.pathname.indexOf('page2.html') === -1) return;
    var html = archivePanel(
      'Interactive Character Files',
      'Every row opens a dynamic profile from the archive database.',
      '<div class="ajax-grid two"><div class="ajax-card"><div data-ajax-character-table></div></div><div class="ajax-card"><div data-ajax-output="character-table"></div></div></div>'
    );
    insertAfter('.toc', html);
    var root = document.querySelector('.ajax-section');
    initCharacterTable(data, root);
  }

  function initWeapons(data) {
    if (location.pathname.indexOf('page3.html') === -1) return;
    var html = archivePanel(
      'Equipment Image Files',
      'Select an image to display its field description in a separate archive panel.',
      '<div class="ajax-card"><div class="ajax-gallery" data-ajax-gallery></div><div data-ajax-output="images"></div></div>'
    );
    insertAfter('.toc', html);
    var root = document.querySelector('.ajax-section');
    initImageDescriptions(data, root, base);
  }

  function initGames(data) {
    if (location.pathname.indexOf('page4.html') === -1) return;
    var html = archivePanel(
      'Rotating Game and Profile Files',
      'Images and briefing text rotate automatically from the archive dataset.',
      '<div class="ajax-card"><div class="ajax-banner" data-ajax-banner></div></div>'
    );
    insertAfter('.toc', html);
    var root = document.querySelector('.ajax-section');
    initBanner(data, root);
  }

  function initChronology(data) {
    if (location.pathname.indexOf('page5.html') === -1) return;
    var html = archivePanel(
      'Chronology, Raccoon City, and Umbrella Complex',
      'Years, city zones, and facility sections reveal dynamic archive descriptions without a page reload.',
      [
        '<div class="ajax-card">',
          '<h3>Incident Years</h3>',
          '<div class="ajax-chip-row" data-ajax-years></div>',
          '<div data-ajax-output="timeline"></div>',
        '</div>',
        '<div class="ajax-grid two">',
          '<div class="ajax-card" data-map="raccoon">',
            '<h3>Raccoon City Map</h3>',
            buildMap(data.maps.raccoonCity),
          '</div>',
          '<div class="ajax-card" data-map="umbrella">',
            '<h3>Umbrella Complex Map</h3>',
            buildMap(data.maps.umbrellaComplex),
          '</div>',
        '</div>'
      ].join('')
    );
    insertAfter('.toc', html);
    var root = document.querySelector('.ajax-section');
    initTimeline(data, root);
    initMap(root.querySelector('[data-map="raccoon"]'), data.maps.raccoonCity);
    initMap(root.querySelector('[data-map="umbrella"]'), data.maps.umbrellaComplex);
  }

  ready(function () {
    fetchJSON(DATA_URL)
      .then(function (data) {
        initHome(data);
        initCharacters(data);
        initWeapons(data);
        initGames(data);
        initChronology(data);
      })
      .catch(function (err) {
        console.warn('Archive data could not be loaded:', err);
        insertAfter('.hero, .toc', archivePanel('Archive data unavailable', 'Start the project through a local server so the browser can load the JSON data files.', statusLine(String(err.message || err), 'error')));
      });
  });
}());
