import "dotenv/config";
import { Bot, InlineKeyboard } from "grammy";
import { env } from "@/lib/env";
import { checkSteamLogin, getTelegramPremiumQuote, getTelegramStarsQuote } from "@/lib/fazercards/catalog";
import { placeOrder } from "@/lib/orders/place-order";
import { getOrdersByEmail } from "@/lib/orders/create";
import {
  FREEKASSA_PAYMENT_METHODS,
  DEFAULT_FREEKASSA_METHOD_ID,
  getFreekassaMethod,
} from "@/lib/payments/freekassa-methods";
import { resolveFreekassaClientIp } from "@/lib/payments/freekassa-api";
import { calculateRetailRub, calculateSteamPaymentRub, formatRub } from "@/lib/pricing";
import { getPricingSettings } from "@/lib/settings";
import { cacheGet, cacheSet } from "@/lib/redis";
import { telegramBotEmail } from "@/lib/telegram/notify";

type Session = {
  flow?: "steam" | "premium" | "stars";
  step?: string;
  data?: Record<string, string | number>;
};

const SESSION_TTL = 3600;

async function loadSession(userId: number): Promise<Session> {
  return (await cacheGet<Session>(`tg:session:${userId}`)) ?? {};
}

async function saveSession(userId: number, session: Session) {
  await cacheSet(`tg:session:${userId}`, session, SESSION_TTL);
}

async function clearSession(userId: number) {
  await cacheSet(`tg:session:${userId}`, {}, 1);
}

function mainMenu() {
  return new InlineKeyboard()
    .text("🎮 Steam", "menu:steam")
    .text("⭐ Premium", "menu:premium")
    .row()
    .text("✨ Stars", "menu:stars")
    .text("📦 Заказы", "menu:orders")
    .row()
    .url("🌐 Сайт", env.APP_URL);
}

function paymentKeyboard(prefix: string) {
  const kb = new InlineKeyboard();
  for (const m of FREEKASSA_PAYMENT_METHODS) {
    const label = m.feeNote ? `${m.label} · ${m.feeNote}` : m.label;
    kb.text(label, `${prefix}:pay:${m.id}`).row();
  }
  kb.text("« Назад", "menu:home");
  return kb;
}

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

async function createBotOrder(
  chatId: number,
  userId: number,
  paymentMethodId: number,
  body: Parameters<typeof placeOrder>[0],
) {
  const result = await placeOrder(body, {
    clientIp: resolveFreekassaClientIp(),
    paymentMethodId,
    extraMetadata: {
      source: "telegram",
      telegramChatId: chatId,
      telegramUserId: userId,
    },
  });
  return result;
}

async function start() {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
  }

  const bot = new Bot(token);

  bot.command("start", async (ctx) => {
    await clearSession(ctx.from!.id);
    await ctx.reply(
      "👋 <b>Zynqo</b> — пополнение Steam, Telegram Premium и Stars.\n\nВыберите услугу:",
      { parse_mode: "HTML", reply_markup: mainMenu() },
    );
  });

  bot.callbackQuery("menu:home", async (ctx) => {
    await ctx.answerCallbackQuery();
    await clearSession(ctx.from!.id);
    await ctx.editMessageText(
      "👋 <b>Zynqo</b>\n\nВыберите услугу:",
      { parse_mode: "HTML", reply_markup: mainMenu() },
    );
  });

  bot.callbackQuery("menu:orders", async (ctx) => {
    await ctx.answerCallbackQuery();
    const email = telegramBotEmail(ctx.from!.id);
    const orders = await getOrdersByEmail(email, 5);
    if (orders.length === 0) {
      await ctx.reply("Заказов пока нет. Оформите первый через меню 👇", {
        reply_markup: mainMenu(),
      });
      return;
    }
    const lines = orders.map(
      (o) =>
        `• <code>${o.publicId}</code> — ${o.status} — ${formatRub(Number(o.amountRub))}`,
    );
    await ctx.reply(`<b>Последние заказы</b>\n${lines.join("\n")}`, {
      parse_mode: "HTML",
      reply_markup: mainMenu(),
    });
  });

  // ─── Steam ───────────────────────────────────────────────
  bot.callbackQuery("menu:steam", async (ctx) => {
    await ctx.answerCallbackQuery();
    await saveSession(ctx.from!.id, { flow: "steam", step: "login", data: {} });
    await ctx.editMessageText(
      "🎮 <b>Пополнение Steam</b>\n\nОтправьте <b>логин Steam</b> (не никнейм из профиля).",
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("« Отмена", "menu:home") },
    );
  });

  // ─── Premium ───────────────────────────────────────────
  bot.callbackQuery("menu:premium", async (ctx) => {
    await ctx.answerCallbackQuery();
    await saveSession(ctx.from!.id, { flow: "premium", step: "username", data: {} });
    await ctx.editMessageText(
      "⭐ <b>Telegram Premium</b>\n\nОтправьте @username получателя:",
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("« Отмена", "menu:home") },
    );
  });

  bot.callbackQuery(/^premium:plan:(3|6|12)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const months = Number(ctx.match![1]) as 3 | 6 | 12;
    const session = await loadSession(ctx.from!.id);
    const username = String(session.data?.username ?? "");
    if (!username) {
      await ctx.reply("Сессия истекла. /start");
      return;
    }
    const settings = await getPricingSettings();
    const quote = await getTelegramPremiumQuote();
    const plan = quote.plans.find((p) => p.months === months);
    const priceRub = plan ? calculateRetailRub(parseFloat(plan.price_usd), settings) : 0;
    await saveSession(ctx.from!.id, {
      flow: "premium",
      step: "pay",
      data: { ...session.data, username, months },
    });
    await ctx.reply(
      `⭐ Premium ${months} мес. → @${username}\n<b>${formatRub(priceRub)}</b>\n\nВыберите оплату:`,
      { parse_mode: "HTML", reply_markup: paymentKeyboard("premium") },
    );
  });

  bot.callbackQuery(/^premium:pay:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const paymentMethodId = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const username = String(session.data?.username ?? "");
    const months = Number(session.data?.months) as 3 | 6 | 12;
    if (!username || ![3, 6, 12].includes(months)) {
      await ctx.reply("Сессия истекла. /start");
      return;
    }
    await ctx.reply("⏳ Создаём заказ…");
    try {
      const result = await createBotOrder(ctx.chat!.id, ctx.from!.id, paymentMethodId, {
        type: "TELEGRAM_PREMIUM",
        email: telegramBotEmail(ctx.from!.id),
        telegramUsername: username,
        months,
      });
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>\n\n` +
          `👇 Нажмите для оплаты:`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl!),
        },
      );
    } catch (err) {
      console.error("[bot premium]", err);
      await ctx.reply("Не удалось создать заказ. Попробуйте позже или на сайте.");
    }
  });

  // ─── Stars ─────────────────────────────────────────────
  bot.callbackQuery("menu:stars", async (ctx) => {
    await ctx.answerCallbackQuery();
    await saveSession(ctx.from!.id, { flow: "stars", step: "username", data: {} });
    await ctx.editMessageText(
      "✨ <b>Telegram Stars</b>\n\nОтправьте @username получателя:",
      { parse_mode: "HTML", reply_markup: new InlineKeyboard().text("« Отмена", "menu:home") },
    );
  });

  bot.callbackQuery(/^stars:pay:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const paymentMethodId = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const username = String(session.data?.username ?? "");
    const quantity = Number(session.data?.quantity ?? 0);
    if (!username || quantity < 50) {
      await ctx.reply("Сессия истекла. /start");
      return;
    }
    await ctx.reply("⏳ Создаём заказ…");
    try {
      const result = await createBotOrder(ctx.chat!.id, ctx.from!.id, paymentMethodId, {
        type: "TELEGRAM_STARS",
        email: telegramBotEmail(ctx.from!.id),
        telegramUsername: username,
        quantity,
      });
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `${quantity} Stars → @${username}\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl!),
        },
      );
    } catch (err) {
      console.error("[bot stars]", err);
      await ctx.reply("Не удалось создать заказ.");
    }
  });

  bot.callbackQuery(/^steam:pay:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const paymentMethodId = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const login = String(session.data?.login ?? "");
    const walletAmountRub = Number(session.data?.walletAmountRub ?? 0);
    if (!login || walletAmountRub < 100) {
      await ctx.reply("Сессия истекла. /start");
      return;
    }
    await ctx.reply("⏳ Создаём заказ…");
    try {
      const result = await createBotOrder(ctx.chat!.id, ctx.from!.id, paymentMethodId, {
        type: "STEAM",
        email: telegramBotEmail(ctx.from!.id),
        steamLogin: login,
        walletAmountRub,
      });
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `Steam: <code>${login}</code> — ${formatRub(walletAmountRub)} на кошелёк\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl!),
        },
      );
    } catch (err) {
      console.error("[bot steam pay]", err);
      await ctx.reply("Не удалось создать заказ.");
    }
  });

  // ─── Text messages (flow steps) ────────────────────────
  bot.on("message:text", async (ctx) => {
    if (!ctx.from || ctx.message.text.startsWith("/")) return;

    const session = await loadSession(ctx.from.id);
    const text = ctx.message.text.trim();

    if (session.flow === "steam" && session.step === "login") {
      const login = text.replace(/\s/g, "");
      const check = await checkSteamLogin(login).catch(() => null);
      if (check && !check.can_refill) {
        await ctx.reply("❌ Логин недоступен для пополнения. Проверьте и отправьте снова.");
        return;
      }
      await saveSession(ctx.from.id, {
        flow: "steam",
        step: "amount",
        data: { login },
      });
      await ctx.reply(
        `Логин: <code>${login}</code>\n\n` +
          "Введите сумму на кошелёк Steam в ₽ (мин. 100):\n" +
          "Или выберите:",
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard()
            .text("300 ₽", "steam:amt:300")
            .text("500 ₽", "steam:amt:500")
            .text("1000 ₽", "steam:amt:1000")
            .row()
            .text("2000 ₽", "steam:amt:2000")
            .text("5000 ₽", "steam:amt:5000"),
        },
      );
      return;
    }

    if (session.flow === "steam" && session.step === "amount") {
      const walletAmountRub = parseInt(text, 10);
      if (!walletAmountRub || walletAmountRub < 100) {
        await ctx.reply("Минимум 100 ₽");
        return;
      }
      const settings = await getPricingSettings();
      const payment = calculateSteamPaymentRub(walletAmountRub, settings);
      await saveSession(ctx.from.id, {
        flow: "steam",
        step: "pay",
        data: { ...session.data, walletAmountRub },
      });
      await ctx.reply(
        `🎮 Steam <code>${session.data?.login}</code>\n` +
          `На кошелёк: ${formatRub(payment.walletRub)}\n` +
          `Комиссия (${payment.feePct}%): ${formatRub(payment.feePctRub)}\n` +
          `Сервисный сбор: ${formatRub(payment.fixedFeeRub)}\n` +
          `<b>Итого: ${formatRub(payment.totalRub)}</b>\n\n` +
          "Выберите способ оплаты:",
        {
          parse_mode: "HTML",
          reply_markup: paymentKeyboard("steam"),
        },
      );
      return;
    }

    if (session.flow === "premium" && session.step === "username") {
      const username = normalizeUsername(text);
      const settings = await getPricingSettings();
      const quote = await getTelegramPremiumQuote().catch(() => null);
      const plans = quote?.plans ?? [];
      if (plans.length === 0) {
        await ctx.reply("Premium временно недоступен.");
        return;
      }
      await saveSession(ctx.from.id, {
        flow: "premium",
        step: "plan",
        data: { username },
      });
      const kb = new InlineKeyboard();
      for (const p of plans) {
        const priceRub = calculateRetailRub(parseFloat(p.price_usd), settings);
        kb.text(`${p.months} мес. — ${formatRub(priceRub)}`, `premium:plan:${p.months}`).row();
      }
      kb.text("« Отмена", "menu:home");
      await ctx.reply(`@${username}\n\nВыберите срок Premium:`, { reply_markup: kb });
      return;
    }

    if (session.flow === "premium" && session.step === "pay") {
      return;
    }

    if (session.flow === "stars" && session.step === "username") {
      const username = normalizeUsername(text);
      await saveSession(ctx.from.id, {
        flow: "stars",
        step: "quantity",
        data: { username },
      });
      await ctx.reply(
        `@${username}\n\nВведите количество Stars (50–10000):`,
        {
          reply_markup: new InlineKeyboard()
            .text("50", "stars:qty:50")
            .text("100", "stars:qty:100")
            .text("500", "stars:qty:500")
            .row()
            .text("1000", "stars:qty:1000"),
        },
      );
      return;
    }

    if (session.flow === "stars" && session.step === "quantity") {
      const quantity = parseInt(text, 10);
      if (!quantity || quantity < 50 || quantity > 10_000) {
        await ctx.reply("От 50 до 10000");
        return;
      }
      const settings = await getPricingSettings();
      const quote = await getTelegramStarsQuote();
      const pricePerStar = parseFloat(quote.price_per_star);
      const totalRub = calculateRetailRub(pricePerStar * quantity, settings);
      await saveSession(ctx.from.id, {
        flow: "stars",
        step: "pay",
        data: { ...session.data, quantity },
      });
      await ctx.reply(
        `✨ ${quantity} Stars → @${session.data?.username}\n` +
          `<b>${formatRub(totalRub)}</b>\n\n` +
          "💡 USDT / TON — без комиссии платёжного сервиса\n\n" +
          "Выберите способ оплаты:",
        { parse_mode: "HTML", reply_markup: paymentKeyboard("stars") },
      );
    }
  });

  bot.callbackQuery(/^steam:amt:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const walletAmountRub = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const settings = await getPricingSettings();
    const payment = calculateSteamPaymentRub(walletAmountRub, settings);
    await saveSession(ctx.from!.id, {
      flow: "steam",
      step: "pay",
      data: { ...session.data, walletAmountRub },
    });
    await ctx.reply(
      `Итого: <b>${formatRub(payment.totalRub)}</b>\nВыберите способ оплаты:`,
      { parse_mode: "HTML", reply_markup: paymentKeyboard("steam") },
    );
  });

  bot.callbackQuery(/^stars:qty:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const quantity = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const settings = await getPricingSettings();
    const quote = await getTelegramStarsQuote();
    const totalRub = calculateRetailRub(parseFloat(quote.price_per_star) * quantity, settings);
    await saveSession(ctx.from!.id, {
      flow: "stars",
      step: "pay",
      data: { ...session.data, quantity },
    });
    await ctx.reply(
      `✨ ${quantity} Stars\n<b>${formatRub(totalRub)}</b>\n\nВыберите оплату:`,
      { parse_mode: "HTML", reply_markup: paymentKeyboard("stars") },
    );
  });

  bot.catch((err) => console.error("[bot]", err));

  console.log("Zynqo Telegram bot started");
  await bot.start();
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
