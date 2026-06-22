# Zynqo — План разработки

> Веб-сервис цифровых товаров (Steam, Telegram, игры, гифт-карты) на базе FazerCards API.
> Домен: zynqo.ru | Поддержка: support@zynqo.ru

---

## Архитектура

```
Покупатель → Zynqo (Freekassa, RUB) → FazerCards API → Webhook → результат
```

**Стек:** Next.js 15, TypeScript, PostgreSQL, Prisma, Redis, fazercards SDK, Freekassa

**Авторизация:** email-only (без пароля). История заказов по email / magic link.

---

## Этап 1 — Фундамент

- [x] Инициализация Next.js + Prisma + PostgreSQL
- [x] Интеграция FazerCards SDK (каталог, баланс, webhook endpoint)
- [x] Redis-кэш каталога
- [x] Базовый layout, тема light/dark
- [x] `.env` конфиг (API key, DB, Redis)

## Этап 2 — Каталог и цены

- [x] Синхронизация каталога (giftcards, topups, gamekeys, telegram, steam)
- [x] Расчёт розничных цен (markup + FX + комиссия Steam)
- [x] Страницы категорий и карточек
- [x] Поиск по каталогу
- [x] Главная с популярными категориями
- [x] SEO-лендинги для рекламы (`/popolnenie-steam`, `/telegram-zvezdy`, …)

## Этап 6 — Юридическое (частично)

- [x] Страницы: О сервисе, Privacy, Terms, Contacts (черновики)
- [x] SEO (sitemap, robots)

## Этап 3 — Checkout и оплата

- [x] Формы заказа (Steam, TG, gift cards, topups, keys)
- [x] Валидация (check-login, validate-id) — опциональная, не блокирует оплату
- [x] Интеграция Freekassa (создание платежа + callback)
- [x] Создание заказа в FazerCards после оплаты
- [x] Обработка webhooks FazerCards
- [x] Страница статуса заказа
- [x] Email-уведомления

## Этап 4 — Поддержка

- [x] Виджет чата (guest + email)
- [x] Realtime (SSE)
- [x] История обращений
- [x] Email-уведомления о новых сообщениях

## Этап 5 — Админ-панель

- [x] Auth admin (скрытый URL)
- [x] Dashboard
- [x] Управление заказами
- [x] Чат поддержки
- [x] Настройки наценки и каталога
- [x] Логи webhook'ов

## Этап 6 — Юридическое и финал

- [ ] Страницы: О сервисе, Privacy, Terms, Contacts
- [ ] SEO (meta, sitemap, robots)
- [ ] Адаптив QA (mobile/tablet/desktop)
- [ ] Тестовые заказы end-to-end
- [ ] Деплой на production

---

## Структура страниц

| URL | Описание |
|-----|----------|
| `/` | Главная |
| `/steam` | Пополнение Steam |
| `/telegram/stars` | Telegram Stars |
| `/telegram/premium` | Telegram Premium |
| `/gift-cards` | Подарочные карты |
| `/gift-cards/[slug]` | Номиналы категории |
| `/games` | Пополнение игр |
| `/games/[slug]` | Форма заказа игры |
| `/keys` | Ключи игр |
| `/order/[id]` | Статус заказа |
| `/orders` | История по email |
| `/about` | О сервисе |
| `/about/privacy` | Политика конфиденциальности |
| `/about/terms` | Пользовательское соглашение |
| `/about/contacts` | Контакты |
| `/popolnenie-steam` | SEO-лендинг Steam (реклама) |
| `/telegram-zvezdy` | SEO-лендинг Stars |
| `/search` | Поиск по каталогу |

---

## FazerCards API

| Тип | Эндпоинт |
|-----|----------|
| Steam | `POST /steam-topup/order` |
| TG Stars | `POST /telegram/stars/buy` |
| TG Premium | `POST /telegram/premium/buy` |
| Gift cards | `GET /giftcards` → `POST /giftcards/order` |
| Top-ups | `GET /topups` → `POST /topups/order` |
| Game keys | `GET /gamekeys` → `POST /gamekeys/order` |
| Webhooks | `order.completed`, `order.failed`, `order.refunded` |

---

## Дизайн

- **Шрифты:** Onest (заголовки), IBM Plex Sans (текст)
- **Темы:** light + dark с переключателем
- **Радиусы:** 4–8px, без «пузырей»
- **Референс:** playerok.com (структура, не копия)

---

## Ценообразование

```
retail_rub = wholesale_usd × USD_RUB_RATE × (1 + markup% / 100)
```

- **USD_RUB_RATE** — курс для пересчёта оптовой цены в рубли (не наценка)
- **DEFAULT_MARKUP_PCT** — общая наценка сервиса, %
- **STEAM_COMMISSION_PCT** — доп. комиссия только за Steam, %

Для Steam при вводе суммы на кошелёk:
```
к оплате = сумма_на_кошелёк × (1 + (markup + steam_commission) / 100)
```

---

## Чеклист перед production

- [ ] API key FazerCards
- [ ] Freekassa merchant ID + secret
- [ ] DNS zynqo.ru
- [ ] SMTP / Resend
- [ ] Юр. данные для Privacy/Terms
- [ ] Стартовая наценка %
