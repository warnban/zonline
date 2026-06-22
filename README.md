# Zynqo

Веб-сервис цифровых товаров на базе FazerCards API.

## Быстрый старт

```bash
# 1. Зависимости
npm install

# 2. PostgreSQL + Redis
npm run docker:up
# PostgreSQL слушает порт 5433 (5432 часто занят локальным postgres на Windows)

# 3. Переменные окружения
cp .env.example .env
# Заполните FAZER_API_KEY

# 4. База данных
npm run db:push

# 5. Запуск
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Документация

План разработки: [PLAN.md](./PLAN.md)

## Стек

- Next.js 16, TypeScript, Tailwind CSS 4
- PostgreSQL, Prisma
- Redis (кэш каталога)
- FazerCards SDK
- Freekassa (оплата)
