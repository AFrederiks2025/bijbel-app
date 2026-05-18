// Bijbel-metadata
// ===============
// Boeknamen volgen de Herziene Statenvertaling, gelijk aan de `boeken`-tabel
// in Supabase. Het veld `dbId` komt overeen met `boeken.volgorde` (1..66) en
// wordt door de app gebruikt om verzen op te vragen uit de `verzen`-tabel.

// Traditionele indeling van de Bijbel.
// Elk item bevat de bookId's die in die categorie horen.
const BIBLE_CATEGORIES = [
  // Oude Testament
  { id: 'wet',        testament: 'OT', name: 'De Wet',             subtitle: '5 boeken',  bookIds: ['gen','exo','lev','num','deu'] },
  { id: 'historie',   testament: 'OT', name: 'Historische boeken', subtitle: '12 boeken', bookIds: ['jos','jdg','rut','1sa','2sa','1ki','2ki','1ch','2ch','ezr','neh','est'] },
  { id: 'wijsheid',   testament: 'OT', name: 'Wijsheidsboeken',    subtitle: '5 boeken',  bookIds: ['job','psa','pro','ecc','sng'] },
  { id: 'groot-prof', testament: 'OT', name: 'Grote Profeten',     subtitle: '5 boeken',  bookIds: ['isa','jer','lam','ezk','dan'] },
  { id: 'klein-prof', testament: 'OT', name: 'Kleine Profeten',    subtitle: '12 boeken', bookIds: ['hos','jol','amo','oba','jon','mic','nam','hab','zep','hag','zec','mal'] },
  // Nieuwe Testament
  { id: 'evangelien', testament: 'NT', name: 'Evangeliën',         subtitle: '4 boeken',  bookIds: ['mat','mrk','luk','jhn'] },
  { id: 'geschied-nt',testament: 'NT', name: 'Geschiedenis',       subtitle: '1 boek',    bookIds: ['act'] },
  { id: 'paulus',     testament: 'NT', name: 'Brieven van Paulus', subtitle: '13 boeken', bookIds: ['rom','1co','2co','gal','eph','php','col','1th','2th','1ti','2ti','tit','phm'] },
  { id: 'algemeen',   testament: 'NT', name: 'Algemene brieven',   subtitle: '8 boeken',  bookIds: ['heb','jas','1pe','2pe','1jn','2jn','3jn','jud'] },
  { id: 'profetie-nt',testament: 'NT', name: 'Profetie',           subtitle: '1 boek',    bookIds: ['rev'] },
];

const BIBLE_BOOKS = {
  OT: [
    { id: 'gen', dbId: 1,  name: 'Genesis',          chapters: 50 },
    { id: 'exo', dbId: 2,  name: 'Exodus',           chapters: 40 },
    { id: 'lev', dbId: 3,  name: 'Leviticus',        chapters: 27 },
    { id: 'num', dbId: 4,  name: 'Numeri',           chapters: 36 },
    { id: 'deu', dbId: 5,  name: 'Deuteronomium',    chapters: 34 },
    { id: 'jos', dbId: 6,  name: 'Jozua',            chapters: 24 },
    { id: 'jdg', dbId: 7,  name: 'Richteren',        chapters: 21 },
    { id: 'rut', dbId: 8,  name: 'Ruth',             chapters: 4  },
    { id: '1sa', dbId: 9,  name: '1 Samuël',         chapters: 31 },
    { id: '2sa', dbId: 10, name: '2 Samuël',         chapters: 24 },
    { id: '1ki', dbId: 11, name: '1 Koningen',       chapters: 22 },
    { id: '2ki', dbId: 12, name: '2 Koningen',       chapters: 25 },
    { id: '1ch', dbId: 13, name: '1 Kronieken',      chapters: 29 },
    { id: '2ch', dbId: 14, name: '2 Kronieken',      chapters: 36 },
    { id: 'ezr', dbId: 15, name: 'Ezra',             chapters: 10 },
    { id: 'neh', dbId: 16, name: 'Nehemia',          chapters: 13 },
    { id: 'est', dbId: 17, name: 'Esther',           chapters: 10 },
    { id: 'job', dbId: 18, name: 'Job',              chapters: 42 },
    { id: 'psa', dbId: 19, name: 'Psalmen',          chapters: 150 },
    { id: 'pro', dbId: 20, name: 'Spreuken',         chapters: 31 },
    { id: 'ecc', dbId: 21, name: 'Prediker',         chapters: 12 },
    { id: 'sng', dbId: 22, name: 'Hooglied',         chapters: 8  },
    { id: 'isa', dbId: 23, name: 'Jesaja',           chapters: 66 },
    { id: 'jer', dbId: 24, name: 'Jeremia',          chapters: 52 },
    { id: 'lam', dbId: 25, name: 'Klaagliederen',    chapters: 5  },
    { id: 'ezk', dbId: 26, name: 'Ezechiël',         chapters: 48 },
    { id: 'dan', dbId: 27, name: 'Daniël',           chapters: 12 },
    { id: 'hos', dbId: 28, name: 'Hosea',            chapters: 14 },
    { id: 'jol', dbId: 29, name: 'Joël',             chapters: 3  },
    { id: 'amo', dbId: 30, name: 'Amos',             chapters: 9  },
    { id: 'oba', dbId: 31, name: 'Obadja',           chapters: 1  },
    { id: 'jon', dbId: 32, name: 'Jona',             chapters: 4  },
    { id: 'mic', dbId: 33, name: 'Micha',            chapters: 7  },
    { id: 'nam', dbId: 34, name: 'Nahum',            chapters: 3  },
    { id: 'hab', dbId: 35, name: 'Habakuk',          chapters: 3  },
    { id: 'zep', dbId: 36, name: 'Sefanja',          chapters: 3  },
    { id: 'hag', dbId: 37, name: 'Haggaï',           chapters: 2  },
    { id: 'zec', dbId: 38, name: 'Zacharia',         chapters: 14 },
    { id: 'mal', dbId: 39, name: 'Maleachi',         chapters: 4  },
  ],
  NT: [
    { id: 'mat', dbId: 40, name: 'Mattheüs',           chapters: 28 },
    { id: 'mrk', dbId: 41, name: 'Marcus',             chapters: 16 },
    { id: 'luk', dbId: 42, name: 'Lukas',              chapters: 24 },
    { id: 'jhn', dbId: 43, name: 'Johannes',           chapters: 21 },
    { id: 'act', dbId: 44, name: 'Handelingen',        chapters: 28 },
    { id: 'rom', dbId: 45, name: 'Romeinen',           chapters: 16 },
    { id: '1co', dbId: 46, name: '1 Korintiërs',       chapters: 16 },
    { id: '2co', dbId: 47, name: '2 Korintiërs',       chapters: 13 },
    { id: 'gal', dbId: 48, name: 'Galaten',            chapters: 6  },
    { id: 'eph', dbId: 49, name: 'Efeziërs',           chapters: 6  },
    { id: 'php', dbId: 50, name: 'Filippenzen',        chapters: 4  },
    { id: 'col', dbId: 51, name: 'Kolossenzen',        chapters: 4  },
    { id: '1th', dbId: 52, name: '1 Tessalonicenzen',  chapters: 5  },
    { id: '2th', dbId: 53, name: '2 Tessalonicenzen',  chapters: 3  },
    { id: '1ti', dbId: 54, name: '1 Timotheüs',        chapters: 6  },
    { id: '2ti', dbId: 55, name: '2 Timotheüs',        chapters: 4  },
    { id: 'tit', dbId: 56, name: 'Titus',              chapters: 3  },
    { id: 'phm', dbId: 57, name: 'Filemon',            chapters: 1  },
    { id: 'heb', dbId: 58, name: 'Hebreeën',           chapters: 13 },
    { id: 'jas', dbId: 59, name: 'Jakobus',            chapters: 5  },
    { id: '1pe', dbId: 60, name: '1 Petrus',           chapters: 5  },
    { id: '2pe', dbId: 61, name: '2 Petrus',           chapters: 3  },
    { id: '1jn', dbId: 62, name: '1 Johannes',         chapters: 5  },
    { id: '2jn', dbId: 63, name: '2 Johannes',         chapters: 1  },
    { id: '3jn', dbId: 64, name: '3 Johannes',         chapters: 1  },
    { id: 'jud', dbId: 65, name: 'Judas',              chapters: 1  },
    { id: 'rev', dbId: 66, name: 'Openbaring',         chapters: 22 },
  ],
};

// Verzen die op de homepage als "vers van de dag" kunnen verschijnen.
// De tekst wordt opgehaald uit Supabase (`verzen`-tabel) via app.js.
const DAILY_VERSES = [
  { ref: 'jhn.3:16',   bookName: 'Johannes 3:16' },
  { ref: 'psa.23:1',   bookName: 'Psalm 23:1' },
  { ref: 'gen.1:1',    bookName: 'Genesis 1:1' },
  { ref: '1co.13:13',  bookName: '1 Korintiërs 13:13' },
  { ref: 'psa.1:1',    bookName: 'Psalm 1:1' },
  { ref: 'mat.5:3',    bookName: 'Mattheüs 5:3' },
  { ref: 'jhn.1:1',    bookName: 'Johannes 1:1' },
];
