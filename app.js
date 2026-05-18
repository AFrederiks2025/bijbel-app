// =====================================================================
// Bijbel-app - navigatie, rendering & leesvoortgang
// Schermen: Home -> Boeken (3 tabs) -> Hoofdstukken -> Lezer
// =====================================================================

(function () {
  'use strict';

  // ---- Helpers --------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const allBooks = [...BIBLE_BOOKS.OT, ...BIBLE_BOOKS.NT];
  const bookById = Object.fromEntries(allBooks.map((b) => [b.id, b]));
  const TOTAL_CHAPTERS = allBooks.reduce((sum, b) => sum + b.chapters, 0);

  // ---- Progress store (localStorage) ---------------------------------
  // Schema: { [bookId]: [chapterNumbers...] }
  const STORAGE_KEY = 'bijbel.progress.v1';
  const VISITED_KEY = 'bijbel.visited.v1';

  function loadSetMap(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      const out = {};
      Object.keys(parsed).forEach((id) => {
        out[id] = new Set(parsed[id]);
      });
      return out;
    } catch {
      return {};
    }
  }

  function saveSetMap(key, map) {
    const serialisable = {};
    Object.keys(map).forEach((id) => {
      serialisable[id] = Array.from(map[id]);
    });
    localStorage.setItem(key, JSON.stringify(serialisable));
  }

  const loadProgress = () => loadSetMap(STORAGE_KEY);
  const saveProgress = (p) => saveSetMap(STORAGE_KEY, p);
  const loadVisited = () => loadSetMap(VISITED_KEY);
  const saveVisited = (v) => saveSetMap(VISITED_KEY, v);

  function isRead(bookId, chapter) {
    return progress[bookId]?.has(chapter) ?? false;
  }

  function setRead(bookId, chapter, read) {
    if (!progress[bookId]) progress[bookId] = new Set();
    if (read) progress[bookId].add(chapter);
    else progress[bookId].delete(chapter);
    saveProgress(progress);
  }

  function readCount(bookId) {
    return progress[bookId]?.size ?? 0;
  }

  function isVisited(bookId, chapter) {
    return visited[bookId]?.has(chapter) ?? false;
  }

  function markVisited(bookId, chapter) {
    if (!visited[bookId]) visited[bookId] = new Set();
    if (!visited[bookId].has(chapter)) {
      visited[bookId].add(chapter);
      saveVisited(visited);
    }
  }

  function overallProgress() {
    let read = 0;
    allBooks.forEach((b) => (read += readCount(b.id)));
    return { read, total: TOTAL_CHAPTERS };
  }

  // ---- App state ------------------------------------------------------
  const progress = loadProgress();
  const visited = loadVisited();
  const LAST_READ_KEY = 'bijbel.lastread.v1';
  const state = {
    currentTab: 'ALL', // 'OT' | 'ALL' | 'NT'
    sortMode: 'traditional', // 'traditional' | 'alphabetical'
    currentBook: null,
    currentChapter: null,
  };

  function loadLastRead() {
    try {
      const raw = localStorage.getItem(LAST_READ_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
  function saveLastRead(bookId, chapter) {
    localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookId, chapter }));
  }
  function clearLastRead() {
    localStorage.removeItem(LAST_READ_KEY);
  }

  // ---- Screen navigation ---------------------------------------------
  const screens = {
    home:       $('#home-view'),
    categories: $('#categories-view'),
    chapters:   $('#chapters-view'),
    reader:     $('#reader-view'),
    settings:   $('#settings-view'),
  };

  function show(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
  }

  // ---- Progress bar element ------------------------------------------
  function progressBar(read, total) {
    const pct = total === 0 ? 0 : Math.round((read / total) * 100);
    const complete = read === total && total > 0;
    const remaining = total - read;
    const status = complete
      ? 'Voltooid ✓'
      : `${read}/${total} · nog ${remaining}`;
    return `
      <div class="row-progress">
        <div class="progress-bar">
          <div class="progress-bar-fill ${complete ? 'complete' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="progress-count">${status}</span>
      </div>
    `;
  }

  // ---- Home: vers van de dag + overall progress ----------------------
  function renderDailyVerse() {
    const dayIndex = Math.floor(Date.now() / 86400000) % DAILY_VERSES.length;
    const entry = DAILY_VERSES[dayIndex];
    const [chapterKey, verseNum] = entry.ref.split(':');
    const chapter = BIBLE_TEXT[chapterKey];
    const text = chapter && chapter[verseNum];

    const el = $('#daily-verse');
    if (text) {
      el.querySelector('p').textContent = text;
      el.querySelector('cite').textContent = '— ' + entry.bookName;
    } else {
      el.querySelector('p').textContent = 'Vers van de dag wordt binnenkort geladen.';
      el.querySelector('cite').textContent = '';
    }
  }

  function renderOverallProgress() {
    const { read, total } = overallProgress();
    const pct = Math.round((read / total) * 100);
    $('#overall-progress-text').textContent = `${read} / ${total} hfst. · ${pct}%`;
    const fill = $('#overall-progress-fill');
    fill.style.width = pct + '%';
    fill.classList.toggle('complete', read === total);

    $('#progress-chip-pct').textContent = pct + '%';
    $('#progress-chip-chapters').textContent = read + ' hfst.';
  }

  function renderContinueReading() {
    const last = loadLastRead();
    const btn = $('#continue-reading');
    if (!last || !bookById[last.bookId]) {
      btn.classList.add('hidden');
      return;
    }
    const book = bookById[last.bookId];
    if (last.chapter < 1 || last.chapter > book.chapters) {
      btn.classList.add('hidden');
      return;
    }
    btn.classList.remove('hidden');
    $('#continue-reading-where').textContent = `${book.name} ${last.chapter}`;
    btn.onclick = () => openChapter(book, last.chapter);
  }

  // ---- Books screen (3 tabbladen: OT / Alle / NT) --------------------
  function renderBooksForTab() {
    const list = $('#books-tab-list');
    list.innerHTML = '';
    let books;
    if (state.currentTab === 'OT') books = BIBLE_BOOKS.OT;
    else if (state.currentTab === 'NT') books = BIBLE_BOOKS.NT;
    else books = allBooks;
    if (state.sortMode === 'alphabetical') {
      books = [...books].sort((a, b) =>
        a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' })
      );
    }
    books.forEach((book) => {
      list.appendChild(buildBookListItem(book, () => openBook(book)));
    });
  }

  function buildBookListItem(book, onClick) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    const read = readCount(book.id);
    const pct = book.chapters === 0 ? 0 : Math.round((read / book.chapters) * 100);
    btn.innerHTML = `
      <div class="row-top">
        <span>${book.name}</span>
        <span class="row-sub">${pct}% · ${book.chapters} hfst.</span>
      </div>
      ${progressBar(read, book.chapters)}
    `;
    btn.addEventListener('click', onClick);
    li.appendChild(btn);
    return li;
  }

  // ---- Chapters of a book --------------------------------------------
  function openBook(book) {
    state.currentBook = book;
    $('#chapters-title').textContent = book.name;
    renderChaptersGrid();
    show('chapters');
  }

  function renderChaptersGrid() {
    const book = state.currentBook;
    const grid = $('#chapters-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= book.chapters; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (BIBLE_TEXT[`${book.id}.${i}`]) btn.classList.add('has-text');
      if (isRead(book.id, i)) btn.classList.add('is-read');
      else if (isVisited(book.id, i)) btn.classList.add('is-visited');
      btn.addEventListener('click', () => openChapter(book, i));
      grid.appendChild(btn);
    }
  }

  // ---- Reader --------------------------------------------------------
  function openChapter(book, chapter) {
    state.currentBook = book;
    state.currentChapter = chapter;
    markVisited(book.id, chapter);
    saveLastRead(book.id, chapter);
    $('#reader-title').textContent = `${book.name} ${chapter}`;

    const key = `${book.id}.${chapter}`;
    const verses = BIBLE_TEXT[key];
    const container = $('#reader-content');
    container.innerHTML = '';

    if (verses) {
      Object.keys(verses)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((vn) => {
          const p = document.createElement('p');
          p.className = 'verse';
          p.innerHTML = `<span class="verse-num">${vn}</span>` + verses[vn];
          container.appendChild(p);
        });
    } else {
      const ph = document.createElement('p');
      ph.className = 'placeholder';
      ph.textContent = 'Tekst van dit hoofdstuk is nog niet toegevoegd.';
      container.appendChild(ph);
    }

    $('#prev-chapter').disabled = chapter <= 1;
    $('#next-chapter').disabled = chapter >= book.chapters;
    updateMarkButton();
    container.scrollTop = 0;

    show('reader');
  }

  function updateMarkButton() {
    const btn = $('#mark-read-btn');
    const read = isRead(state.currentBook.id, state.currentChapter);
    btn.classList.toggle('is-read', read);
    btn.textContent = read ? '✓ Gelezen' : 'Markeer als gelezen';
  }

  function toggleCurrentRead() {
    const { id } = state.currentBook;
    const ch = state.currentChapter;
    setRead(id, ch, !isRead(id, ch));
    updateMarkButton();
    renderOverallProgress();
  }

  // ---- Wiring --------------------------------------------------------
  $('#open-categories').addEventListener('click', () => {
    renderBooksForTab();
    show('categories');
  });

  $('#open-settings').addEventListener('click', () => show('settings'));

  const notYetWired = (msg) => () => alert(msg);
  $('#login-google').addEventListener('click', notYetWired(
    'Inloggen met Google is bijna klaar. Zodra Supabase is gekoppeld kun je hier inloggen.'
  ));
  $('#create-account').addEventListener('click', notYetWired(
    'Account aanmaken volgt zodra de inlog-koppeling met Supabase actief is.'
  ));
  $('#open-help').addEventListener('click', notYetWired(
    'Hulp & ondersteuning komt binnenkort. Voor nu kun je je vraag stellen aan de beheerder.'
  ));

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'back-to-home':
        renderOverallProgress();
        renderContinueReading();
        show('home');
        break;
      case 'back-to-books':
        renderBooksForTab();
        show('categories');
        break;
      case 'back-to-chapters':
        renderChaptersGrid();
        show('chapters');
        break;
    }
  });

  $$('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentTab = btn.dataset.tab;
      renderBooksForTab();
    });
  });

  $$('.sort-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.sortMode = btn.dataset.sort;
      $$('.sort-btn').forEach((b) => {
        b.classList.toggle('active', b.dataset.sort === state.sortMode);
      });
      renderBooksForTab();
    });
  });

  $('#prev-chapter').addEventListener('click', () => {
    if (state.currentChapter > 1) {
      openChapter(state.currentBook, state.currentChapter - 1);
    }
  });
  $('#next-chapter').addEventListener('click', () => {
    if (state.currentChapter < state.currentBook.chapters) {
      openChapter(state.currentBook, state.currentChapter + 1);
    }
  });

  $('#mark-read-btn').addEventListener('click', toggleCurrentRead);

  $('#reset-progress').addEventListener('click', () => {
    if (!confirm('Weet je zeker dat je alle leesvoortgang wilt wissen?')) return;
    Object.keys(progress).forEach((k) => delete progress[k]);
    Object.keys(visited).forEach((k) => delete visited[k]);
    saveProgress(progress);
    saveVisited(visited);
    clearLastRead();
    renderOverallProgress();
    renderBooksForTab();
    renderContinueReading();
    show('home');
  });

  // ---- Init ----------------------------------------------------------
  renderDailyVerse();
  renderOverallProgress();
  renderContinueReading();
  renderBooksForTab();
  show('home');
})();
