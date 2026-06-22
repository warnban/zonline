import "dotenv/config";
import { Bot, InlineKeyboard, Keyboard } from "grammy";
import type { Context } from "grammy";
import { env } from "@/lib/env";
import { checkSteamLogin, getTelegramPremiumQuote, getTelegramStarsQuote } from "@/lib/fazercards/catalog";
import { placeOrder } from "@/lib/orders/place-order";
import { getOrdersByEmail } from "@/lib/orders/create";
import {
  FREEKASSA_PAYMENT_METHODS,
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
const MENU_BTN = "🏠 Главное меню";

async function loadSession(userId: number): Promise<Session> {
  return (await cacheGet<Session>(`tg:session:${userId}`)) ?? {};
}

async function saveSession(userId: number, session: Session) {
  await cacheSet(`tg:session:${userId}`, session, SESSION_TTL);
}

async function clearSession(userId: number) {
  await cacheSet(`tg:session:${userId}`, {}, 1);
}

function replyMenuKeyboard() {
  return new Keyboard().text(MENU_BTN).resized().persistent();
}

function mainMenuInline() {
  // По одной кнопке в ряд — на мобильном 2 в ряд обрезают текст («Premium» → «Premiu»).
  return new InlineKeyboard()
    .text("🎮 Steam", "menu:steam")
    .row()
    .text("⭐ Telegram Premium", "menu:premium")
    .row()
    .text("✨ Telegram Stars", "menu:stars")
    .row()
    .text("📦 Мои заказы", "menu:orders")
    .row()
    .url("🌐 Сайт zynqo.ru", env.APP_URL);
}

function paymentMethodLabel(m: (typeof FREEKASSA_PAYMENT_METHODS)[number]): string {
  if (m.crypto && m.feeNote) return `${m.label} (${m.feeNote})`;
  return m.label;
}

function paymentKeyboard(prefix: string) {
  const kb = new InlineKeyboard();
  for (const m of FREEKASSA_PAYMENT_METHODS) {
    kb.text(paymentMethodLabel(m), `${prefix}:pay:${m.id}`).row();
  }
  kb.text("« Отмена", "menu:home");
  return kb;
}

function truncateForButton(text: string, max = 28): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function usernamePickKeyboard(flow: "premium" | "stars", tgUsername?: string) {
  const kb = new InlineKeyboard();
  if (tgUsername) {
    kb.text(
      truncateForButton(`👤 Себе (@${tgUsername})`),
      `${flow}:username:me`,
    ).row();
  }
  kb.text("✏️ Ввести @username", `${flow}:username:manual`).row();
  kb.text("« Отмена", "menu:home");
  return kb;
}

function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@/, "");
}

function isMenuButton(text: string): boolean {
  return text.trim() === MENU_BTN;
}

async function showHome(ctx: Context, edit = false) {
  if (!ctx.from) return;
  await clearSession(ctx.from.id);
  const text = "👋 <b>Zynqo</b>\n\nВыберите услугу:";
  if (edit && ctx.callbackQuery?.message) {
    await ctx.editMessageText(text, { parse_mode: "HTML", reply_markup: mainMenuInline() });
    return;
  }
  await ctx.reply(text, {
    parse_mode: "HTML",
    reply_markup: mainMenuInline(),
  });
}

async function proceedPremiumUsername(ctx: Context, username: string) {
  if (!ctx.from) return;
  const settings = await getPricingSettings();
  const quote = await getTelegramPremiumQuote().catch(() => null);
  const plans = quote?.plans ?? [];
  if (plans.length === 0) {
    await ctx.reply("Premium временно недоступен.", { reply_markup: mainMenuInline() });
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
  await ctx.reply(`⭐ Premium → @${username}\n\nВыберите срок:`, { reply_markup: kb });
}

async function proceedStarsUsername(ctx: Context, username: string) {
  if (!ctx.from) return;
  await saveSession(ctx.from.id, {
    flow: "stars",
    step: "quantity",
    data: { username },
  });
  await ctx.reply(`✨ Stars → @${username}\n\nВыберите количество или введите число (50–10000):`, {
    reply_markup: new InlineKeyboard()
      .text("50", "stars:qty:50")
      .text("100", "stars:qty:100")
      .text("500", "stars:qty:500")
      .row()
      .text("1000", "stars:qty:1000")
      .row()
      .text("« Отмена", "menu:home"),
  });
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
    await ctx.reply("👋 Добро пожаловать в <b>Zynqo</b>!", {
      parse_mode: "HTML",
      reply_markup: replyMenuKeyboard(),
    });
    await showHome(ctx);
  });

  bot.command("menu", async (ctx) => {
    await showHome(ctx);
  });

  bot.callbackQuery("menu:home", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showHome(ctx, true);
  });

  bot.callbackQuery("menu:orders", async (ctx) => {
    await ctx.answerCallbackQuery();
    const email = telegramBotEmail(ctx.from!.id);
    const orders = await getOrdersByEmail(email, 5);
    const text =
      orders.length === 0
        ? "Заказов пока нет. Оформите первый через меню 👇"
        : `<b>Последние заказы</b>\n${orders
            .map(
              (o) =>
                `• <code>${o.publicId}</code> — ${o.status} — ${formatRub(Number(o.amountRub))}`,
            )
            .join("\n")}`;
    if (ctx.callbackQuery.message) {
      await ctx.editMessageText(text, {
        parse_mode: "HTML",
        reply_markup: mainMenuInline(),
      });
      return;
    }
    await ctx.reply(text, {
      parse_mode: "HTML",
      reply_markup: mainMenuInline(),
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
    const tgUser = ctx.from?.username;
    await ctx.editMessageText(
      "⭐ <b>Telegram Premium</b>\n\nКому оформить подписку?",
      {
        parse_mode: "HTML",
        reply_markup: usernamePickKeyboard("premium", tgUser),
      },
    );
  });

  bot.callbackQuery("premium:username:me", async (ctx) => {
    await ctx.answerCallbackQuery();
    const username = ctx.from?.username;
    if (!username) {
      await ctx.reply(
        "У вас не задан @username в Telegram.\nЗадайте его в настройках или нажмите «Ввести @username».",
        { reply_markup: usernamePickKeyboard("premium") },
      );
      return;
    }
    await proceedPremiumUsername(ctx, username);
  });

  bot.callbackQuery("premium:username:manual", async (ctx) => {
    await ctx.answerCallbackQuery();
    await saveSession(ctx.from!.id, { flow: "premium", step: "username", data: {} });
    await ctx.reply("✏️ Отправьте @username получателя сообщением:", {
      reply_markup: new InlineKeyboard().text("« Отмена", "menu:home"),
    });
  });

  bot.callbackQuery(/^premium:plan:(3|6|12)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const months = Number(ctx.match![1]) as 3 | 6 | 12;
    const session = await loadSession(ctx.from!.id);
    const username = String(session.data?.username ?? "");
    if (!username) {
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
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
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
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
      if (!result.paymentUrl) {
        await ctx.reply("Не удалось получить ссылку на оплату. Попробуйте позже.");
        return;
      }
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>\n\n` +
          `👇 Нажмите для оплаты:`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl),
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
    const tgUser = ctx.from?.username;
    await ctx.editMessageText(
      "✨ <b>Telegram Stars</b>\n\nКому отправить Stars?",
      {
        parse_mode: "HTML",
        reply_markup: usernamePickKeyboard("stars", tgUser),
      },
    );
  });

  bot.callbackQuery("stars:username:me", async (ctx) => {
    await ctx.answerCallbackQuery();
    const username = ctx.from?.username;
    if (!username) {
      await ctx.reply(
        "У вас не задан @username в Telegram.\nЗадайте его в настройках или нажмите «Ввести @username».",
        { reply_markup: usernamePickKeyboard("stars") },
      );
      return;
    }
    await proceedStarsUsername(ctx, username);
  });

  bot.callbackQuery("stars:username:manual", async (ctx) => {
    await ctx.answerCallbackQuery();
    await saveSession(ctx.from!.id, { flow: "stars", step: "username", data: {} });
    await ctx.reply("✏️ Отправьте @username получателя сообщением:", {
      reply_markup: new InlineKeyboard().text("« Отмена", "menu:home"),
    });
  });

  bot.callbackQuery(/^stars:pay:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const paymentMethodId = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const username = String(session.data?.username ?? "");
    const quantity = Number(session.data?.quantity ?? 0);
    if (!username || quantity < 50) {
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
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
      if (!result.paymentUrl) {
        await ctx.reply("Не удалось получить ссылку на оплату.");
        return;
      }
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `${quantity} Stars → @${username}\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl),
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
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
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
      if (!result.paymentUrl) {
        await ctx.reply("Не удалось получить ссылку на оплату.");
        return;
      }
      await clearSession(ctx.from!.id);
      const method = getFreekassaMethod(paymentMethodId);
      await ctx.reply(
        `✅ Заказ <code>${result.orderId}</code>\n` +
          `Steam: <code>${login}</code> — ${formatRub(walletAmountRub)} на кошелёк\n` +
          `Оплата: <b>${method?.label ?? "Freekassa"}</b>`,
        {
          parse_mode: "HTML",
          reply_markup: new InlineKeyboard().url("💳 Оплатить", result.paymentUrl),
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

    const text = ctx.message.text.trim();

    if (isMenuButton(text)) {
      await showHome(ctx);
      return;
    }

    const session = await loadSession(ctx.from.id);

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
            .row()
            .text("1000 ₽", "steam:amt:1000")
            .text("2000 ₽", "steam:amt:2000")
            .row()
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
      if (!username || username.length < 3) {
        await ctx.reply("Укажите корректный @username (минимум 3 символа).");
        return;
      }
      await proceedPremiumUsername(ctx, username);
      return;
    }

    if (session.flow === "premium" && session.step === "pay") {
      return;
    }

    if (session.flow === "stars" && session.step === "username") {
      const username = normalizeUsername(text);
      if (!username || username.length < 3) {
        await ctx.reply("Укажите корректный @username (минимум 3 символа).");
        return;
      }
      await proceedStarsUsername(ctx, username);
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
      return;
    }

    // Нет активного шага — подсказка
    if (!session.flow) {
      await ctx.reply("Выберите услугу в меню 👇", { reply_markup: mainMenuInline() });
    }
  });

  bot.callbackQuery(/^steam:amt:(\d+)$/, async (ctx) => {
    await ctx.answerCallbackQuery();
    const walletAmountRub = Number(ctx.match![1]);
    const session = await loadSession(ctx.from!.id);
    const login = String(session.data?.login ?? "");
    if (!login) {
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
      return;
    }
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
    const username = String(session.data?.username ?? "");
    if (!username) {
      await ctx.reply("Сессия истекла. Нажмите «Главное меню» или /start");
      return;
    }
    const settings = await getPricingSettings();
    const quote = await getTelegramStarsQuote();
    const totalRub = calculateRetailRub(parseFloat(quote.price_per_star) * quantity, settings);
    await saveSession(ctx.from!.id, {
      flow: "stars",
      step: "pay",
      data: { ...session.data, quantity },
    });
    await ctx.reply(
      `✨ ${quantity} Stars → @${username}\n<b>${formatRub(totalRub)}</b>\n\nВыберите оплату:`,
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
