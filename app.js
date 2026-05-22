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
  const bookByDbId = Object.fromEntries(allBooks.map((b) => [b.dbId, b]));
  const TOTAL_CHAPTERS = allBooks.reduce((sum, b) => sum + b.chapters, 0);

  // ---- Bijbeltekst-cache (localStorage) ------------------------------
  // Sleutel: `${dbId}.${chapter}` -> { verseNumber: text }
  const VERSES_CACHE_KEY = 'bijbel.verses.v1';
  function loadVersesCache() {
    try { return JSON.parse(localStorage.getItem(VERSES_CACHE_KEY)) || {}; }
    catch { return {}; }
  }
  function saveVersesCache(cache) {
    try { localStorage.setItem(VERSES_CACHE_KEY, JSON.stringify(cache)); }
    catch (e) { console.warn('verses cache full', e); }
  }
  const versesCache = loadVersesCache();
  // Welke hoofdstukken zijn beschikbaar in de DB (per dbId een Set)
  const availableChapters = {};

  // ---- Supabase client ------------------------------------------------
  const SUPABASE_URL = 'https://kgfbjcecvwaumauhqhpg.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_HeBhlxA4xsU6BiJEi6tKmg_VDLSIgSG';
  const sb = window.supabase && window.supabase.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;
  let currentUser = null;

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
    if (currentUser && sb) {
      sb.from('reading_progress')
        .upsert({
          user_id: currentUser.id,
          book_id: bookId,
          chapter,
          is_read: read,
          read_at: read ? new Date().toISOString() : null,
        }, { onConflict: 'user_id,book_id,chapter' })
        .then(({ error }) => error && console.warn('sync setRead', error));
    }
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
      if (currentUser && sb) {
        sb.from('reading_progress')
          .upsert({
            user_id: currentUser.id,
            book_id: bookId,
            chapter,
            is_read: false,
          }, { onConflict: 'user_id,book_id,chapter', ignoreDuplicates: true })
          .then(({ error }) => error && console.warn('sync markVisited', error));
      }
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
    if (currentUser && sb) {
      sb.from('last_read')
        .upsert({
          user_id: currentUser.id,
          book_id: bookId,
          chapter,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        .then(({ error }) => error && console.warn('sync lastRead', error));
    }
  }
  function clearLastRead() {
    localStorage.removeItem(LAST_READ_KEY);
    if (currentUser && sb) {
      sb.from('last_read').delete().eq('user_id', currentUser.id)
        .then(({ error }) => error && console.warn('sync clearLastRead', error));
    }
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

  // ---- Bijbeltekst ophalen uit Supabase ------------------------------
  async function fetchChapterFromDb(book, chapter) {
    const cacheKey = `${book.dbId}.${chapter}`;
    if (versesCache[cacheKey]) return versesCache[cacheKey];
    if (!sb) return null;
    const { data, error } = await sb
      .from('verzen')
      .select('vers, tekst')
      .eq('boek_id', book.dbId)
      .eq('hoofdstuk', chapter)
      .order('vers', { ascending: true });
    if (error) { console.warn('fetch verzen', error); return null; }
    if (!data || data.length === 0) return null;
    const verses = {};
    data.forEach((row) => { verses[row.vers] = row.tekst; });
    versesCache[cacheKey] = verses;
    saveVersesCache(versesCache);
    return verses;
  }

  async function loadAvailableChapters() {
    if (!sb) return;
    // Eén lichte query: per (boek_id, hoofdstuk) één rij. De index is op vers=1
    // niet gegarandeerd, dus filteren we expliciet. PostgREST levert max. 1000
    // rijen per request, terwijl er 1189 hoofdstukken zijn — dus pagineren.
    const pageSize = 1000;
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb
        .from('verzen')
        .select('boek_id, hoofdstuk')
        .eq('vers', 1)
        .order('boek_id', { ascending: true })
        .order('hoofdstuk', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) { console.warn('fetch availability', error); return; }
      (data || []).forEach((row) => {
        if (!availableChapters[row.boek_id]) availableChapters[row.boek_id] = new Set();
        availableChapters[row.boek_id].add(row.hoofdstuk);
      });
      if (!data || data.length < pageSize) break;
    }
  }

  function chapterHasText(book, chapter) {
    return availableChapters[book.dbId]?.has(chapter) ?? false;
  }

  // ---- Home: vers van de dag + overall progress ----------------------
  function parseRef(entry) {
    const [chapterKey, verseNumStr] = entry.ref.split(':');
    const [bookId, chapterStr] = chapterKey.split('.');
    return { book: bookById[bookId], chapter: Number(chapterStr), verseNum: Number(verseNumStr) };
  }

  function pickDailyVerseEntry() {
    const dayIndex = Math.floor(Date.now() / 86400000);
    const available = DAILY_VERSES.filter((e) => {
      const { book, chapter } = parseRef(e);
      return book && availableChapters[book.dbId]?.has(chapter);
    });
    const pool = available.length > 0 ? available : DAILY_VERSES;
    return pool[dayIndex % pool.length];
  }

  async function renderDailyVerse() {
    const entry = pickDailyVerseEntry();
    const { book, chapter, verseNum } = parseRef(entry);

    const el = $('#daily-verse');
    el.querySelector('p').textContent = 'Vers van de dag wordt geladen…';
    el.querySelector('cite').textContent = '';

    if (!book) return;
    const verses = await fetchChapterFromDb(book, chapter);
    const text = verses && verses[verseNum];
    if (text) {
      el.querySelector('p').textContent = text;
      el.querySelector('cite').textContent = '— ' + entry.bookName;
    } else {
      el.querySelector('p').textContent = 'Vers van de dag is nog niet beschikbaar.';
      el.querySelector('cite').textContent = '— ' + entry.bookName;
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
      if (chapterHasText(book, i)) btn.classList.add('has-text');
      if (isRead(book.id, i)) btn.classList.add('is-read');
      else if (isVisited(book.id, i)) btn.classList.add('is-visited');
      btn.addEventListener('click', () => openChapter(book, i));
      grid.appendChild(btn);
    }
  }

  // ---- Reader --------------------------------------------------------
  async function openChapter(book, chapter) {
    state.currentBook = book;
    state.currentChapter = chapter;
    markVisited(book.id, chapter);
    saveLastRead(book.id, chapter);
    $('#reader-title').textContent = `${book.name} ${chapter}`;

    const container = $('#reader-content');
    container.innerHTML = '';

    $('#prev-chapter').disabled = chapter <= 1;
    $('#next-chapter').disabled = chapter >= book.chapters;
    updateMarkButton();
    container.scrollTop = 0;
    show('reader');

    const loading = document.createElement('p');
    loading.className = 'placeholder';
    loading.textContent = 'Tekst wordt geladen…';
    container.appendChild(loading);

    const verses = await fetchChapterFromDb(book, chapter);
    // Negeer als de gebruiker inmiddels naar een ander hoofdstuk is genavigeerd
    if (state.currentBook?.id !== book.id || state.currentChapter !== chapter) return;
    container.innerHTML = '';

    if (verses) {
      Object.keys(verses)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((vn) => {
          const p = document.createElement('p');
          p.className = 'verse';
          const numSpan = document.createElement('span');
          numSpan.className = 'verse-num';
          numSpan.textContent = vn;
          p.appendChild(numSpan);
          p.appendChild(document.createTextNode(verses[vn]));
          container.appendChild(p);
        });
    } else {
      const ph = document.createElement('p');
      ph.className = 'placeholder';
      ph.textContent = 'Tekst van dit hoofdstuk is nog niet toegevoegd.';
      container.appendChild(ph);
    }
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

  function updateAccountUI() {
    const card = $('.settings-account-card');
    if (!card) return;
    const title = card.querySelector('.account-card-title');
    const sub = card.querySelector('.account-card-sub');
    const loginBtn = $('#login-google');
    const registerBtn = $('#create-account');
    let logoutBtn = $('#logout-btn');

    if (currentUser) {
      const name = currentUser.user_metadata?.full_name
        || currentUser.user_metadata?.name
        || currentUser.email
        || 'Ingelogd';
      title.textContent = name;
      sub.textContent = currentUser.email || 'Je voortgang wordt automatisch gesynchroniseerd.';
      loginBtn.classList.add('hidden');
      registerBtn.classList.add('hidden');
      if (!logoutBtn) {
        logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-btn';
        logoutBtn.type = 'button';
        logoutBtn.className = 'link-btn account-register-btn';
        logoutBtn.textContent = 'Uitloggen';
        logoutBtn.addEventListener('click', async () => {
          if (sb) await sb.auth.signOut();
        });
        card.appendChild(logoutBtn);
      } else {
        logoutBtn.classList.remove('hidden');
      }
    } else {
      title.textContent = 'Niet ingelogd';
      sub.textContent = 'Log in om je voortgang op te slaan en te synchroniseren tussen apparaten.';
      loginBtn.classList.remove('hidden');
      registerBtn.classList.remove('hidden');
      if (logoutBtn) logoutBtn.classList.add('hidden');
    }
  }

  async function pullFromServer() {
    if (!currentUser || !sb) return;
    const { data, error } = await sb
      .from('reading_progress')
      .select('book_id, chapter, is_read');
    if (error) { console.warn('pull progress', error); return; }
    (data || []).forEach((row) => {
      if (row.is_read) {
        if (!progress[row.book_id]) progress[row.book_id] = new Set();
        progress[row.book_id].add(row.chapter);
      } else {
        if (!visited[row.book_id]) visited[row.book_id] = new Set();
        visited[row.book_id].add(row.chapter);
      }
    });
    saveProgress(progress);
    saveVisited(visited);

    const { data: lr } = await sb
      .from('last_read').select('book_id, chapter').maybeSingle();
    if (lr) localStorage.setItem(LAST_READ_KEY, JSON.stringify({ bookId: lr.book_id, chapter: lr.chapter }));
  }

  async function pushLocalToServer() {
    if (!currentUser || !sb) return;
    const rows = [];
    Object.keys(progress).forEach((bookId) => {
      progress[bookId].forEach((chapter) => {
        rows.push({ user_id: currentUser.id, book_id: bookId, chapter, is_read: true });
      });
    });
    Object.keys(visited).forEach((bookId) => {
      visited[bookId].forEach((chapter) => {
        if (!progress[bookId]?.has(chapter)) {
          rows.push({ user_id: currentUser.id, book_id: bookId, chapter, is_read: false });
        }
      });
    });
    if (rows.length) {
      const { error } = await sb.from('reading_progress')
        .upsert(rows, { onConflict: 'user_id,book_id,chapter', ignoreDuplicates: true });
      if (error) console.warn('push progress', error);
    }
    const last = loadLastRead();
    if (last) {
      const { error } = await sb.from('last_read')
        .upsert({ user_id: currentUser.id, book_id: last.bookId, chapter: last.chapter,
                  updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
      if (error) console.warn('push lastRead', error);
    }
  }

  async function syncAfterLogin() {
    await pullFromServer();
    await pushLocalToServer();
    renderOverallProgress();
    renderContinueReading();
    if ($('#categories-view').classList.contains('active')) renderBooksForTab();
    if ($('#chapters-view').classList.contains('active') && state.currentBook) renderChaptersGrid();
  }

  if (sb) {
    sb.auth.getSession().then(({ data }) => {
      currentUser = data.session?.user ?? null;
      updateAccountUI();
      if (currentUser) syncAfterLogin();
    });
    sb.auth.onAuthStateChange((event, session) => {
      currentUser = session?.user ?? null;
      updateAccountUI();
      if (event === 'SIGNED_IN') syncAfterLogin();
    });
  }

  const startGoogleLogin = async () => {
    if (!sb) { alert('Supabase client kon niet geladen worden.'); return; }
    const { error } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) alert('Inloggen mislukt: ' + error.message);
  };
  $('#login-google').addEventListener('click', startGoogleLogin);
  $('#create-account').addEventListener('click', startGoogleLogin);

  $('#open-help').addEventListener('click', () => alert(
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

  $('#reset-progress').addEventListener('click', async () => {
    if (!confirm('Weet je zeker dat je alle leesvoortgang wilt wissen?')) return;
    Object.keys(progress).forEach((k) => delete progress[k]);
    Object.keys(visited).forEach((k) => delete visited[k]);
    saveProgress(progress);
    saveVisited(visited);
    clearLastRead();
    if (currentUser && sb) {
      const { error: e1 } = await sb.from('reading_progress').delete().eq('user_id', currentUser.id);
      if (e1) console.warn('reset progress', e1);
    }
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

  loadAvailableChapters().then(() => {
    renderDailyVerse();
    if ($('#chapters-view').classList.contains('active') && state.currentBook) {
      renderChaptersGrid();
    }
  });
})();
