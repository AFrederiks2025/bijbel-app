// Statenvertaling (1637) - Publiek domein
// =========================================
// Dit bestand bevat:
//   - BIBLE_BOOKS: alle 66 boeken met hun aantal hoofdstukken
//   - BIBLE_TEXT:  een sample van veelgelezen passages in de Statenvertaling
//
// Een hoofdstuk dat niet in BIBLE_TEXT staat, toont een placeholder.
// Voeg gerust meer hoofdstukken toe onder BIBLE_TEXT.

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
    { id: 'gen', name: 'Genesis',          chapters: 50 },
    { id: 'exo', name: 'Exodus',           chapters: 40 },
    { id: 'lev', name: 'Leviticus',        chapters: 27 },
    { id: 'num', name: 'Numeri',           chapters: 36 },
    { id: 'deu', name: 'Deuteronomium',    chapters: 34 },
    { id: 'jos', name: 'Jozua',            chapters: 24 },
    { id: 'jdg', name: 'Richteren',        chapters: 21 },
    { id: 'rut', name: 'Ruth',             chapters: 4  },
    { id: '1sa', name: '1 Samuël',         chapters: 31 },
    { id: '2sa', name: '2 Samuël',         chapters: 24 },
    { id: '1ki', name: '1 Koningen',       chapters: 22 },
    { id: '2ki', name: '2 Koningen',       chapters: 25 },
    { id: '1ch', name: '1 Kronieken',      chapters: 29 },
    { id: '2ch', name: '2 Kronieken',      chapters: 36 },
    { id: 'ezr', name: 'Ezra',             chapters: 10 },
    { id: 'neh', name: 'Nehemia',          chapters: 13 },
    { id: 'est', name: 'Esther',           chapters: 10 },
    { id: 'job', name: 'Job',              chapters: 42 },
    { id: 'psa', name: 'Psalmen',          chapters: 150 },
    { id: 'pro', name: 'Spreuken',         chapters: 31 },
    { id: 'ecc', name: 'Prediker',         chapters: 12 },
    { id: 'sng', name: 'Hooglied',         chapters: 8  },
    { id: 'isa', name: 'Jesaja',           chapters: 66 },
    { id: 'jer', name: 'Jeremia',          chapters: 52 },
    { id: 'lam', name: 'Klaagliederen',    chapters: 5  },
    { id: 'ezk', name: 'Ezechiël',         chapters: 48 },
    { id: 'dan', name: 'Daniël',           chapters: 12 },
    { id: 'hos', name: 'Hosea',            chapters: 14 },
    { id: 'jol', name: 'Joël',             chapters: 3  },
    { id: 'amo', name: 'Amos',             chapters: 9  },
    { id: 'oba', name: 'Obadja',           chapters: 1  },
    { id: 'jon', name: 'Jona',             chapters: 4  },
    { id: 'mic', name: 'Micha',            chapters: 7  },
    { id: 'nam', name: 'Nahum',            chapters: 3  },
    { id: 'hab', name: 'Habakuk',          chapters: 3  },
    { id: 'zep', name: 'Zefanja',          chapters: 3  },
    { id: 'hag', name: 'Haggaï',           chapters: 2  },
    { id: 'zec', name: 'Zacharia',         chapters: 14 },
    { id: 'mal', name: 'Maleachi',         chapters: 4  },
  ],
  NT: [
    { id: 'mat', name: 'Mattheüs',              chapters: 28 },
    { id: 'mrk', name: 'Markus',                chapters: 16 },
    { id: 'luk', name: 'Lukas',                 chapters: 24 },
    { id: 'jhn', name: 'Johannes',              chapters: 21 },
    { id: 'act', name: 'Handelingen',           chapters: 28 },
    { id: 'rom', name: 'Romeinen',              chapters: 16 },
    { id: '1co', name: '1 Korinthe',            chapters: 16 },
    { id: '2co', name: '2 Korinthe',            chapters: 13 },
    { id: 'gal', name: 'Galaten',               chapters: 6  },
    { id: 'eph', name: 'Efeze',                 chapters: 6  },
    { id: 'php', name: 'Filippensen',           chapters: 4  },
    { id: 'col', name: 'Kolossensen',           chapters: 4  },
    { id: '1th', name: '1 Thessalonicensen',    chapters: 5  },
    { id: '2th', name: '2 Thessalonicensen',    chapters: 3  },
    { id: '1ti', name: '1 Timotheüs',           chapters: 6  },
    { id: '2ti', name: '2 Timotheüs',           chapters: 4  },
    { id: 'tit', name: 'Titus',                 chapters: 3  },
    { id: 'phm', name: 'Filémon',               chapters: 1  },
    { id: 'heb', name: 'Hebreeën',              chapters: 13 },
    { id: 'jas', name: 'Jakobus',               chapters: 5  },
    { id: '1pe', name: '1 Petrus',              chapters: 5  },
    { id: '2pe', name: '2 Petrus',              chapters: 3  },
    { id: '1jn', name: '1 Johannes',            chapters: 5  },
    { id: '2jn', name: '2 Johannes',            chapters: 1  },
    { id: '3jn', name: '3 Johannes',            chapters: 1  },
    { id: 'jud', name: 'Judas',                 chapters: 1  },
    { id: 'rev', name: 'Openbaring',            chapters: 22 },
  ],
};

// Sleutel: '<bookId>.<chapter>'
// Waarde: object met verse-nummer -> tekst
const BIBLE_TEXT = {
  'gen.1': {
    1: 'In den beginne schiep God den hemel en de aarde.',
    2: 'De aarde nu was woest en ledig, en duisternis was op den afgrond; en de Geest Gods zweefde op de wateren.',
    3: 'En God zeide: Daar zij licht! en daar werd licht.',
    4: 'En God zag het licht, dat het goed was; en God maakte scheiding tussen het licht en tussen de duisternis.',
    5: 'En God noemde het licht dag, en de duisternis noemde Hij nacht. Toen was het avond geweest, en het was morgen geweest, de eerste dag.',
  },

  'psa.1': {
    1: 'Welgelukzalig is de man, die niet wandelt in den raad der goddelozen, noch staat op den weg der zondaren, noch zit in het gestoelte der spotters;',
    2: 'Maar zijn lust is in des HEEREN wet, en hij overdenkt Zijn wet dag en nacht.',
    3: 'Want hij zal zijn als een boom, geplant aan waterbeken, die zijn vrucht geeft op zijn tijd, en welks blad niet afvalt; en al wat hij doet, zal wel gelukken.',
    4: 'Alzo zijn de goddelozen niet, maar als het kaf, dat de wind heendrijft.',
    5: 'Daarom zullen de goddelozen niet bestaan in het gericht, noch de zondaars in de vergadering der rechtvaardigen.',
    6: 'Want de HEERE kent den weg der rechtvaardigen; maar de weg der goddelozen zal vergaan.',
  },

  'psa.23': {
    1: 'Een psalm van David. De HEERE is mijn Herder, mij zal niets ontbreken.',
    2: 'Hij doet mij nederliggen in grazige weiden; Hij voert mij zachtjes aan zeer stille wateren.',
    3: 'Hij verkwikt mijn ziel; Hij leidt mij in het spoor der gerechtigheid, om Zijns Naams wil.',
    4: 'Al ging ik ook in een dal der schaduw des doods, ik zou geen kwaad vrezen, want Gij zijt met mij; Uw stok en Uw staf, die vertroosten mij.',
    5: 'Gij richt de tafel toe voor mijn aangezicht, tegenover mijn tegenpartijders; Gij maakt mijn hoofd vet met olie, mijn beker is overvloeiende.',
    6: 'Immers zullen mij het goede en de weldadigheid volgen al de dagen mijns levens; en ik zal in het huis des HEEREN blijven in lengte van dagen.',
  },

  'mat.5': {
    3: 'Zalig zijn de armen van geest; want hunner is het Koninkrijk der hemelen.',
    4: 'Zalig zijn die treuren; want zij zullen vertroost worden.',
    5: 'Zalig zijn de zachtmoedigen; want zij zullen het aardrijk beërven.',
    6: 'Zalig zijn die hongeren en dorsten naar de gerechtigheid; want zij zullen verzadigd worden.',
    7: 'Zalig zijn de barmhartigen; want hun zal barmhartigheid geschieden.',
    8: 'Zalig zijn de reinen van hart; want zij zullen God zien.',
    9: 'Zalig zijn de vreedzamen; want zij zullen Gods kinderen genaamd worden.',
    10: 'Zalig zijn die vervolgd worden om der gerechtigheid wil; want hunner is het Koninkrijk der hemelen.',
    11: 'Zalig zijt gij, als u de mensen smaden, en vervolgen, en liegende alle kwaad tegen u spreken, om Mijnentwil.',
    12: 'Verblijdt en verheugt u; want uw loon is groot in de hemelen; want alzo hebben zij vervolgd de profeten, die voor u geweest zijn.',
  },

  'mat.6': {
    9:  'Gij dan bidt aldus: Onze Vader, Die in de hemelen zijt! Uw Naam worde geheiligd.',
    10: 'Uw Koninkrijk kome. Uw wil geschiede, gelijk in den hemel alzo ook op de aarde.',
    11: 'Geef ons heden ons dagelijks brood.',
    12: 'En vergeef ons onze schulden, gelijk ook wij vergeven onzen schuldenaren.',
    13: 'En leid ons niet in verzoeking, maar verlos ons van den boze. Want Uw is het Koninkrijk, en de kracht, en de heerlijkheid, in der eeuwigheid, amen.',
  },

  'jhn.1': {
    1: 'In den beginne was het Woord, en het Woord was bij God, en het Woord was God.',
    2: 'Dit was in den beginne bij God.',
    3: 'Alle dingen zijn door Hetzelve gemaakt, en zonder Hetzelve is geen ding gemaakt, dat gemaakt is.',
    4: 'In Hetzelve was het Leven, en het Leven was het Licht der mensen.',
    5: 'En het Licht schijnt in de duisternis, en de duisternis heeft hetzelve niet begrepen.',
  },

  'jhn.3': {
    16: 'Want alzo lief heeft God de wereld gehad, dat Hij Zijn eniggeboren Zoon gegeven heeft, opdat een iegelijk die in Hem gelooft, niet verderve, maar het eeuwige leven hebbe.',
    17: 'Want God heeft Zijn Zoon niet gezonden in de wereld, opdat Hij de wereld veroordelen zou, maar opdat de wereld door Hem zou behouden worden.',
  },

  '1co.13': {
    1: 'Al ware het, dat ik de talen der mensen en der engelen sprak, en de liefde niet had, zo ware ik een klinkend metaal, of luidende schel geworden.',
    2: 'En al ware het dat ik de gave der profetie had, en wist al de verborgenheden en al de wetenschap; en al ware het, dat ik al het geloof had, zodat ik bergen verzette, en de liefde niet had, zo ware ik niets.',
    3: 'En al ware het, dat ik al mijn goederen tot onderhoud der armen uitdeelde, en al ware het, dat ik mijn lichaam overgaf, opdat ik verbrand zou worden, en had de liefde niet, zo zou het mij geen nuttigheid geven.',
    4: 'De liefde is lankmoedig, zij is goedertieren; de liefde is niet afgunstig; de liefde handelt niet lichtvaardiglijk, zij is niet opgeblazen;',
    5: 'Zij handelt niet ongeschiktelijk, zij zoekt zichzelve niet, zij wordt niet verbitterd, zij denkt geen kwaad;',
    6: 'Zij verblijdt zich niet in de ongerechtigheid, maar zij verblijdt zich in de waarheid;',
    7: 'Zij bedekt alle dingen, zij gelooft alle dingen, zij hoopt alle dingen, zij verdraagt alle dingen.',
    8: 'De liefde vergaat nimmermeer; maar hetzij profetieën, zij zullen te niet gedaan worden; hetzij talen, zij zullen ophouden; hetzij kennis, zij zal te niet gedaan worden.',
    9: 'Want wij kennen ten dele, en wij profeteren ten dele;',
    10: 'Doch wanneer het volmaakte zal gekomen zijn, dan zal hetgeen ten dele is, te niet gedaan worden.',
    11: 'Toen ik een kind was, sprak ik als een kind, was ik gezind als een kind, overlegde ik als een kind; maar wanneer ik een man geworden ben, zo heb ik te niet gedaan hetgeen eens kinds was.',
    12: 'Want wij zien nu door een spiegel in een duistere rede, maar alsdan zullen wij zien aangezicht tot aangezicht; nu ken ik ten dele, maar alsdan zal ik kennen, gelijk ook ik gekend ben.',
    13: 'En nu blijft geloof, hoop en liefde, deze drie; doch de meeste van deze is de liefde.',
  },
};

// Verzen die op de homepage als "vers van de dag" kunnen verschijnen.
const DAILY_VERSES = [
  { ref: 'jhn.3:16',   bookName: 'Johannes 3:16' },
  { ref: 'psa.23:1',   bookName: 'Psalm 23:1' },
  { ref: 'gen.1:1',    bookName: 'Genesis 1:1' },
  { ref: '1co.13:13',  bookName: '1 Korinthe 13:13' },
  { ref: 'psa.1:1',    bookName: 'Psalm 1:1' },
  { ref: 'mat.5:3',    bookName: 'Mattheüs 5:3' },
  { ref: 'jhn.1:1',    bookName: 'Johannes 1:1' },
];
