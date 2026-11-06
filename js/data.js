// Matnlardagi ranglar kadrlardan, nomlardagi "kuyov jo'ra", "pistonli" kabi so'zlar do'kon yozuvlaridan olingan.
const look = (id, reel, uz, uzn, ru, run) => ({
  poster: `assets/v/${id}.webp`, video: `assets/v/${id}.mp4`, reel,
  name: { uz, ru }, note: { uz: uzn, ru: run },
});

export const LOOKS = [
  look('l01', 'DZxBwKVAptI', 'Kechki bazm', "To‘q jigarrang pidjak, oq shim va cho‘ntak ro‘moli.", 'Вечерний приём', 'Тёмно-коричневый пиджак, белые брюки и платок в кармане.'),
  look('l02', 'Dd8ksFagAjo', 'Ikki ohang', "Ikki qatorli kostyumlar: sarg‘ish va jigarrang, shlyapa bilan.", 'Два тона', 'Двубортные костюмы в песочном и коричневом, со шляпой.'),
  look('l03', 'DZhxczZN-8X', 'Kuyov jo‘ra', "To‘q yashil pidjak, och shim, ingichka galstuk.", 'Друг жениха', 'Тёмно-зелёный пиджак, светлые брюки, узкий галстук.'),
  look('l04', 'De1EKD-g4iS', 'To‘q ko‘k', "To‘q ko‘k kostyum, qizil galstuk va ro‘mol.", 'Тёмно-синий', 'Тёмно-синий костюм, красный галстук и платок.'),
  look('l05', 'DZoy9cCgCmp', 'Do‘st to‘yi', "Och jigarrang pidjak va to‘q shim.", 'На свадьбу друга', 'Светло-коричневый пиджак и тёмные брюки.'),
  look('l06', 'DZjtJU4gast', 'Kuyov bola', "Uch qismli kostyum, issiq jigarrang.", 'Жених', 'Костюм-тройка тёплого коричневого цвета.'),
  look('l07', 'DeCZE7wAffZ', 'Yo‘l-yo‘l galstuk', "Ikki qatorli pidjak, yo‘l-yo‘l galstuk va ro‘mol.", 'Галстук в полоску', 'Двубортный пиджак, галстук в полоску и платок.'),
  look('l08', 'DdOsOlrghnn', 'Sokin klassika', "To‘q rangli ikki qatorli pidjak va shim.", 'Спокойная классика', 'Тёмный двубортный пиджак и брюки.'),
  look('l09', 'DfKjr7Cgobl', 'Krem va mis', "Krem va mis rangli kostyumlar, shlyapa bilan.", 'Крем и медь', 'Костюмы кремового и медного цвета, со шляпой.'),
  look('l10', 'DZuRYwmAqEv', 'Pistonli qora', "Qora kostyum, pistonli variant.", 'Чёрный с кантом', 'Чёрный костюм, вариант с кантом.'),
];

export const DETAILS = [
  { video: 'assets/d/cuff.mp4', poster: 'assets/d/cuff.webp', uz: 'Manjet va galstuk', ru: 'Манжета и галстук' },
  { video: 'assets/d/label.mp4', poster: 'assets/d/label.webp', uz: 'Ichki yorliq', ru: 'Внутренняя этикетка' },
  { video: 'assets/d/square.mp4', poster: 'assets/d/square.webp', uz: 'Cho‘ntak ro‘moli', ru: 'Платок в кармане' },
  { video: 'assets/d/shoe.mp4', poster: 'assets/d/shoe.webp', uz: 'Poyabzal', ru: 'Обувь' },
];

export const KIT = [
  { uz: ['Kostyum-shim', 'Ikki qatorli va uch qismli'], ru: ['Костюмы', 'Двубортные и тройки'] },
  { uz: ['Ko‘ylak', 'Oq va rangli'], ru: ['Рубашки', 'Белые и цветные'] },
  { uz: ['Galstuk va ro‘mol', 'Kostyum rangiga mos'], ru: ['Галстук и платок', 'В тон костюму'] },
  { uz: ['Poyabzal', 'Klassik erkaklar poyabzali'], ru: ['Обувь', 'Классическая мужская'] },
];

export const T = {
  uz: {
    navLooks: 'Obrazlar', navDetails: 'Detallar', navVisit: 'Manzil',
    heroLine: 'To‘y va bazmlar uchun looklar', heroHint: 'Pastga suring',
    open: 'Yaqindan ko‘rish', close: 'Yopish',
    sayKick: 'Sifatni tanlaganlar tanlovi',
    sayQuote: 'Har bir tikuvda mukammallik, har bir ko‘rinishda ishonch.',
    detKick: 'Detallar', detTitle: 'Yaqindan qarang',
    kitKick: 'Bir joyda', kitTitle: 'To‘y oqshomi uchun butun obraz',
    visKick: 'Manzil', visTitle: 'Kelib, kiyib ko‘ring',
    visAddr: 'Urganch, Pahlavon Mahmud 221', visNear: 'Olimpia stadioni, Dasaf yon tarafi',
    call: 'Qo‘ng‘iroq', route: 'Yo‘nalish', reel: 'Instagram’da ko‘rish', city: 'Urganch',
    dlgHow: 'Narx va o‘lcham bo‘yicha qo‘ng‘iroq qiling yoki do‘konga keling.',
    prev: 'Oldingi', next: 'Keyingi',
  },
  ru: {
    navLooks: 'Образы', navDetails: 'Детали', navVisit: 'Адрес',
    heroLine: 'Образы для свадеб и торжеств', heroHint: 'Листайте вниз',
    open: 'Смотреть ближе', close: 'Закрыть',
    sayKick: 'Выбор тех, кто выбирает качество',
    sayQuote: 'Совершенство в каждом шве, уверенность в каждом образе.',
    detKick: 'Детали', detTitle: 'Посмотрите ближе',
    kitKick: 'В одном месте', kitTitle: 'Весь образ для свадебного вечера',
    visKick: 'Адрес', visTitle: 'Приходите примерить',
    visAddr: 'Ургенч, Пахлавон Махмуд 221', visNear: 'Стадион «Олимпия», рядом с Дасаф',
    call: 'Позвонить', route: 'Маршрут', reel: 'Смотреть в Instagram', city: 'Ургенч',
    dlgHow: 'Позвоните, чтобы узнать цену и размеры, или приходите в магазин.',
    prev: 'Назад', next: 'Дальше',
  },
};
