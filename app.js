// =====================================================================
// Bijbel-app - navigatie & rendering
// Schermen: Home -> Categorieën -> Boeken -> Hoofdstukken -> Lezer
// =====================================================================

(function () {
  'use strict';

  // ---- Helpers --------------------------------------------------------
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const allBooks = [...BIBLE_BOOKS.OT, ...BIBLE_BOOKS.NT];
  const bookById = Object.fromEntries(allBooks.map((b) => [b.id, b]));

  // ---- App state ------------------------------------------------------
  const state = {
    listMode: 'traditioneel', // 'traditioneel' | 'alfabetisch'
    currentCategory: null,
    currentBook: null,
    currentChapter: null,
  };

  // ---- Screen navigation ---------------------------------------------
  const screens = {
    home:       $('#home-view'),
    categories: $('#categories-view'),
    books:      $('#books-view'),
    chapters:   $('#chapters-view'),
    reader:     $('#reader-view'),
  };

  function show(name) {
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
  }

  // ---- Home: vers van de dag -----------------------------------------
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

  // ---- Categories screen ---------------------------------------------
  function renderCategories() {
    if (state.listMode === 'alfabetisch') {
      // Bij alfabetisch: alle boeken plat, op naam gesorteerd, geen categorieën.
      // We hergebruiken de OT-container voor de hele lijst, NT-blok wordt verborgen.
      $('#categories-ot').innerHTML = '';
      $('#categories-nt').innerHTML = '';
      $$('#categories-view .testament-label').forEach((el) => (el.style.display = 'none'));

      const sorted = [...allBooks].sort((a, b) =>
        a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' })
      );
      const ul = $('#categories-ot');
      ul.style.display = '';
      sorted.forEach((book) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.textContent = book.name;
        btn.addEventListener('click', () => openBookDirect(book));
        li.appendChild(btn);
        ul.appendChild(li);
      });
      return;
    }

    // Traditioneel: categorieën onder elk testament.
    $$('#categories-view .testament-label').forEach((el) => (el.style.display = ''));
    const otUl = $('#categories-ot');
    const ntUl = $('#categories-nt');
    otUl.innerHTML = '';
    ntUl.innerHTML = '';

    BIBLE_CATEGORIES.forEach((cat) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.innerHTML =
        `<span>${cat.name}</span>` +
        `<span class="row-sub">${cat.subtitle}</span>`;
      btn.addEventListener('click', () => openCategory(cat));
      li.appendChild(btn);
      (cat.testament === 'OT' ? otUl : ntUl).appendChild(li);
    });
  }

  // ---- Books in category ---------------------------------------------
  function openCategory(category) {
    state.currentCategory = category;
    $('#books-title').textContent = category.name;
    const list = $('#books-list');
    list.innerHTML = '';
    category.bookIds.forEach((id) => {
      const book = bookById[id];
      if (!book) return;
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.innerHTML =
        `<span>${book.name}</span>` +
        `<span class="row-sub">${book.chapters} hfst.</span>`;
      btn.addEventListener('click', () => openBook(book));
      li.appendChild(btn);
      list.appendChild(li);
    });
    show('books');
  }

  function openBookDirect(book) {
    // Vanaf de alfabetische lijst springen we de boeken-tussenstap over.
    state.currentCategory = null;
    openBook(book);
  }

  // ---- Chapters of a book --------------------------------------------
  function openBook(book) {
    state.currentBook = book;
    $('#chapters-title').textContent = book.name;
    const grid = $('#chapters-grid');
    grid.innerHTML = '';
    for (let i = 1; i <= book.chapters; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      if (BIBLE_TEXT[`${book.id}.${i}`]) {
        btn.classList.add('has-text');
      }
      btn.addEventListener('click', () => openChapter(book, i));
      grid.appendChild(btn);
    }
    show('chapters');
  }

  // ---- Reader --------------------------------------------------------
  function openChapter(book, chapter) {
    state.currentBook = book;
    state.currentChapter = chapter;
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
          p.innerHTML =
            `<span class="verse-num">${vn}</span>` + verses[vn];
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

    show('reader');
  }

  // ---- Wiring --------------------------------------------------------
  $('#open-categories').addEventListener('click', () => show('categories'));

  document.body.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    switch (btn.dataset.action) {
      case 'back-to-home':       show('home'); break;
      case 'back-to-categories': show('categories'); break;
      case 'back-to-books':
        if (state.currentCategory) show('books');
        else show('categories');
        break;
      case 'back-to-chapters':   show('chapters'); break;
    }
  });

  $$('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.listMode = btn.dataset.mode;
      renderCategories();
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

  // ---- Init ----------------------------------------------------------
  renderDailyVerse();
  renderCategories();
  show('home');
})();
