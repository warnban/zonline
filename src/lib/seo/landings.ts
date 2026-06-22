export type LandingPage = {
  path: string;
  /** Страница checkout (для UI) */
  canonicalPath: string;
  title: string;
  description: string;
  h1: string;
  keywords: string[];
  /** SEO-текст под формой (уникальный контент для индексации) */
  seoBody?: string[];
};

export const landingPages: LandingPage[] = [
  // —— Steam ——
  {
    path: "/popolnenie-steam",
    canonicalPath: "/steam",
    title: "Пополнение Steam из России — по логину, карта и СБП",
    description:
      "Пополните кошелёк Steam по логину из РФ. Оплата картой и СБП. Зачисление обычно за несколько минут. Без VPN.",
    h1: "Пополнение Steam",
    keywords: ["пополнение steam", "пополнить steam", "steam россия", "steam кошелёк", "стим"],
    seoBody: [
      "Пополнение Steam через Zynqo — укажите логин аккаунта, сумму в рублях и email. Оплата картой или СБП.",
      "Подходит для покупки игр, DLC и предметов в магазине Steam. Регистрация на сайте не требуется.",
    ],
  },
  {
    path: "/popolnenie-steam-koshelek",
    canonicalPath: "/steam",
    title: "Пополнить кошелёк Steam — быстро и безопасно",
    description: "Steam Wallet по логину. Прозрачная комиссия, оплата в рублях из России.",
    h1: "Пополнить кошелёк Steam",
    keywords: ["пополнить кошелёк steam", "steam wallet", "steam баланс", "баланс стим"],
  },
  {
    path: "/steam-popolnit-koshelek-rf",
    canonicalPath: "/steam",
    title: "Steam пополнение кошелька РФ — Zynqo",
    description: "Пополнение Steam для пользователей из России. Логин + сумма + оплата онлайн.",
    h1: "Steam пополнение в РФ",
    keywords: ["steam пополнение рф", "steam россия 2025", "как пополнить steam"],
  },
  // —— Telegram ——
  {
    path: "/telegram-zvezdy",
    canonicalPath: "/telegram/stars",
    title: "Купить Telegram Stars — по @username",
    description: "Telegram Stars без регистрации. Укажите @username, количество звёзд и оплатите картой или СБП.",
    h1: "Telegram Stars",
    keywords: ["telegram stars", "тг звёзды", "купить stars", "звезды телеграм", "stars telegram"],
    seoBody: [
      "Telegram Stars — внутренняя валюта для донатов, стикеров и покупок в ботах. Укажите @username получателя.",
      "Зачисление после оплаты. Статус заказа и подтверждение придут на email.",
    ],
  },
  {
    path: "/kupit-telegram-stars",
    canonicalPath: "/telegram/stars",
    title: "Купить звёзды Telegram — моментально",
    description: "Покупка Telegram Stars для себя или в подарок. Оплата из России.",
    h1: "Купить звёзды Telegram",
    keywords: ["купить звезды telegram", "звезды тг", "telegram stars купить"],
  },
  {
    path: "/telegram-premium-kupit",
    canonicalPath: "/telegram/premium",
    title: "Telegram Premium — подписка 3, 6, 12 месяцев",
    description: "Оформите Telegram Premium по @username. Оплата картой и СБП из РФ.",
    h1: "Telegram Premium",
    keywords: ["telegram premium", "тг премиум", "купить premium telegram", "премиум телеграм"],
  },
  {
    path: "/kupit-telegram-premium",
    canonicalPath: "/telegram/premium",
    title: "Купить Telegram Premium — по username",
    description: "Подписка Telegram Premium на 3, 6 или 12 месяцев. Без автопродления через Zynqo.",
    h1: "Купить Telegram Premium",
    keywords: ["купить telegram premium", "premium telegram россия"],
  },
  // —— Игры ——
  {
    path: "/popolnenie-pubg-mobile",
    canonicalPath: "/products/pubg-mobile",
    title: "Пополнение PUBG Mobile UC — по ID",
    description: "Купить UC для PUBG Mobile. Мгновенное пополнение по Player ID. Оплата из России.",
    h1: "Пополнение PUBG Mobile",
    keywords: ["pubg mobile uc", "купить uc pubg", "пополнение pubg", "pubg uc", "пабг uc"],
    seoBody: [
      "Пополнение UC в PUBG Mobile: выберите номинал, укажите Player ID из профиля игры и email.",
      "Подходит для покупки Royale Pass, скинов и наборов в магазине PUBG Mobile.",
    ],
  },
  {
    path: "/kupit-uc-pubg",
    canonicalPath: "/products/pubg-mobile",
    title: "Купить UC PUBG Mobile — донат",
    description: "UC для PUBG Mobile с доставкой на аккаунт. Карта, СБП.",
    h1: "Купить UC PUBG",
    keywords: ["купить uc", "uc pubg mobile", "донат pubg"],
  },
  {
    path: "/popolnenie-free-fire",
    canonicalPath: "/products/free-fire",
    title: "Пополнение Free Fire — алмазы Diamonds",
    description: "Алмазы Free Fire по ID. Быстрое пополнение Garena Free Fire из РФ.",
    h1: "Пополнение Free Fire",
    keywords: ["free fire алмазы", "free fire diamonds", "пополнение free fire", "донат free fire"],
  },
  {
    path: "/popolnenie-igr",
    canonicalPath: "/products",
    title: "Пополнение игр — PUBG, Free Fire, Roblox",
    description: "Донат и пополнение мобильных игр по ID аккаунта. Оплата картой и СБП.",
    h1: "Пополнение игр",
    keywords: ["пополнение игр", "донат игры", "игровая валюта"],
  },
  // —— Карты ——
  {
    path: "/podarochnye-karty",
    canonicalPath: "/products",
    title: "Подарочные карты — Steam, PSN, Xbox, Apple",
    description: "Цифровые gift cards с кодом на email. Steam, PlayStation, iTunes, Valorant и др.",
    h1: "Подарочные карты",
    keywords: ["подарочные карты", "gift card", "цифровые карты"],
  },
  {
    path: "/kupit-kartu-steam",
    canonicalPath: "/products/steam-codes",
    title: "Купить карту Steam — код на email",
    description: "Подарочная карта Steam Wallet. Код активации сразу после оплаты.",
    h1: "Карта Steam",
    keywords: ["карта steam", "steam gift card", "подарочная карта steam", "код steam"],
  },
  {
    path: "/popolnenie-playstation",
    canonicalPath: "/products/playstation",
    title: "Карта PlayStation Store — PSN",
    description: "Подарочная карта PlayStation для игр и подписок. Моментальная доставка кода.",
    h1: "PlayStation карта",
    keywords: ["playstation карта", "psn карта", "playstation store", "пополнение psn"],
  },
  {
    path: "/kupit-robux",
    canonicalPath: "/products/roblox",
    title: "Купить Robux — карта Roblox",
    description: "Robux через подарочную карту Roblox. Код на email после оплаты.",
    h1: "Купить Robux",
    keywords: ["robux", "робуксы", "roblox карта", "купить robux"],
  },
  {
    path: "/valorant-points-kupit",
    canonicalPath: "/products/valorant",
    title: "Купить Valorant Points — код VP",
    description: "Valorant VP для скинов и Battle Pass. Код активации на email.",
    h1: "Valorant Points",
    keywords: ["valorant points", "vp valorant", "валорант поинты"],
  },
  {
    path: "/fortnite-vbucks",
    canonicalPath: "/products/fortnite",
    title: "V-Bucks Fortnite — купить код",
    description: "V-Bucks для Fortnite. Мгновенная доставка кода активации.",
    h1: "V-Bucks Fortnite",
    keywords: ["vbucks", "v-bucks", "fortnite vbucks", "в-баксы"],
  },
  {
    path: "/itunes-karta",
    canonicalPath: "/products/itunes",
    title: "Карта iTunes / App Store — Apple ID",
    description: "Подарочная карта App Store & iTunes для России. Код на email.",
    h1: "Карта iTunes",
    keywords: ["itunes карта", "app store карта", "apple gift card", "айтюнс"],
  },
  {
    path: "/klyuchi-igr",
    canonicalPath: "/products",
    title: "Коды и карты для игр — Steam, Valorant",
    description: "Цифровые коды активации и подарочные карты для популярных игр и сервисов.",
    h1: "Коды для игр",
    keywords: ["коды игр", "game codes", "цифровые коды"],
  },
];

export function getLandingByPath(path: string): LandingPage | undefined {
  return landingPages.find((l) => l.path === path);
}

export function getAllLandingPaths(): string[] {
  return landingPages.map((l) => l.path);
}
