export type ProductSectionId = "games" | "cards" | "services";

export type CuratedProduct = {
  slug: string;
  title: string;
  description: string;
  section: ProductSectionId;
  href?: string;
  categoryId?: string;
  catalogType?: "topup" | "gift_card";
  cta: string;
  /** Синонимы для поиска (рус/англ, Wordstat) */
  keywords?: string[];
};

export const productSections: {
  id: ProductSectionId;
  title: string;
  intro: string;
}[] = [
  {
    id: "games",
    title: "Пополнение игр",
    intro:
      "Мгновенно пополняйте ваши любимые мобильные игры с безопасными и быстрыми транзакциями.",
  },
  {
    id: "cards",
    title: "Подарочные карты",
    intro:
      "Цифровые подарочные карты и коды активации для ваших любимых платформ. Моментальная доставка кода на email.",
  },
  {
    id: "services",
    title: "Сервисы",
    intro: "Пополняйте балансы популярных сервисов быстро и безопасно.",
  },
];

/** Каталог как на https://fazercards.com/products — только эти позиции */
export const curatedProducts: CuratedProduct[] = [
  {
    slug: "pubg-mobile",
    title: "PUBG Mobile",
    description: "Мгновенное и безопасное пополнение UC",
    section: "games",
    // topup: pubg_mobile недоступен, используется auto-канал доставки
    categoryId: "pubg_mobile_auto",
    catalogType: "topup",
    cta: "Пополнить сейчас",
    keywords: ["pubg", "пабг", "пубг", "pubg mobile", "uc", "юси", "донат pubg", "пополнение pubg"],
  },
  {
    slug: "free-fire",
    title: "Free Fire",
    description: "Пополнение Diamonds — быстро, безопасно, мгновенная доставка",
    section: "games",
    categoryId: "free_fire_cis",
    catalogType: "topup",
    cta: "Пополнить сейчас",
    keywords: ["free fire", "фри фаер", "freefire", "алмазы", "diamonds", "garena", "донат ff"],
  },
  {
    slug: "roblox",
    title: "Roblox",
    description:
      "Моментальное пополнение Robux с подарочными картами. Не нужно ждать — код приходит сразу после оплаты.",
    section: "cards",
    categoryId: "roblox_ru",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["roblox", "роблокс", "robux", "робуксы", "карта roblox"],
  },
  {
    slug: "pubg-codes",
    title: "PUBG Codes",
    description: "UC-коды для PUBG Mobile. Мгновенная доставка и надёжное пополнение аккаунта.",
    section: "cards",
    categoryId: "pubg_mobile",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["pubg код", "uc код", "код pubg", "pubg codes"],
  },
  {
    slug: "free-fire-codes",
    title: "Free Fire Codes",
    description:
      "Алмазы Free Fire с подарочными картами: храните и активируйте в любой момент. Мгновенная доставка кода.",
    section: "cards",
    categoryId: "garena_free_fire_global",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["free fire код", "код free fire", "алмазы код"],
  },
  {
    slug: "itunes",
    title: "iTunes",
    description:
      "Подарочные карты iTunes / App Store / Apple ID. Пополните баланс и покупайте подписки и игры.",
    section: "cards",
    categoryId: "app_store_itunes_ru",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["itunes", "айтunes", "app store", "apple", "apple id", "айтюнс"],
  },
  {
    slug: "playstation",
    title: "PlayStation",
    description: "Карты PlayStation для пополнения кошелька, игр и подписок. Мгновенное получение кода.",
    section: "cards",
    categoryId: "playstation_tr",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["playstation", "psn", "ps store", "плейстейшн", "ps plus"],
  },
  {
    slug: "valorant",
    title: "Valorant",
    description:
      "Valorant Points для скинов. Мгновенная доставка кодов активации для покупки агентов и контента.",
    section: "cards",
    categoryId: "valorant_ru",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["valorant", "валорант", "vp", "valorant points"],
  },
  {
    slug: "fortnite",
    title: "Fortnite",
    description:
      "V-Bucks для Fortnite. Мгновенная доставка кодов для боевого пропуска, скинов и контента.",
    section: "cards",
    categoryId: "fortnite",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["fortnite", "фортнайт", "v-bucks", "vbucks", "в-баксы"],
  },
  {
    slug: "steam-codes",
    title: "Steam Codes",
    description:
      "Подарочные карты Steam для пополнения кошелька. Мгновенная доставка кодов — удобно и безопасно.",
    section: "cards",
    categoryId: "steam_wallet_global",
    catalogType: "gift_card",
    cta: "Купить карту",
    keywords: ["steam код", "steam card", "steam wallet card", "карта steam", "подарочная steam"],
  },
  {
    slug: "steam",
    title: "Steam",
    description: "Пополнение кошелька — требуется только логин, мгновенная доставка",
    section: "services",
    href: "/steam",
    cta: "Пополнить сейчас",
    keywords: ["steam", "стим", "steam wallet", "пополнение steam", "пополнить steam", "кошелек steam"],
  },
  {
    slug: "telegram",
    title: "Telegram",
    description: "Stars & Premium — быстро, безопасно и удобно",
    section: "services",
    href: "/telegram",
    cta: "Пополнить сейчас",
    keywords: ["telegram", "телеграм", "тг", "stars", "звезды", "premium", "премиум"],
  },
];

export function getCuratedProduct(slug: string): CuratedProduct | undefined {
  return curatedProducts.find((p) => p.slug === slug);
}

export function getCuratedCategoryIds(): string[] {
  return [
    ...new Set(
      curatedProducts
        .filter((p) => p.categoryId)
        .map((p) => p.categoryId as string),
    ),
  ];
}

export function getProductsBySection(section: ProductSectionId): CuratedProduct[] {
  return curatedProducts.filter((p) => p.section === section);
}

export { searchCatalog, searchCuratedProducts } from "./search";
