/**
 * Generates finance workbook: npm install --no-save exceljs && node scripts/generate-finance-xlsx.mjs
 */
import ExcelJS from "exceljs";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "finance");
const outPath = join(outDir, "zynqo-finance.xlsx");

mkdirSync(outDir, { recursive: true });

const wb = new ExcelJS.Workbook();
wb.creator = "Zynqo";
wb.created = new Date();

const rubFmt = '"₽"#,##0';
const usdFmt = '"$"#,##0.00';
const pctFmt = "0.00%";

// ─── Sheet: Инструкция ─────────────────────────────────────────────
const wsHelp = wb.addWorksheet("Инструкция", {
  views: [{ state: "frozen", ySplit: 1 }],
});
wsHelp.columns = [{ width: 90 }];
const helpLines = [
  "Zynqo — учёт дохода и комиссий",
  "",
  "1. Лист «Способы оплаты» — укажите % комиссии Freekassa для каждого метода (из личного кабинета).",
  "2. Лист «Настройки» — курс USD/RUB, фикс. комиссии USDT (вывод FK, пополнение Fazer).",
  "3. Лист «Заказы» — добавляйте строки с заказами. Способ оплаты выбирайте из списка.",
  "4. Лист «Период» — сводка: выручка, опт, маржа, комиссии, чистый доход.",
  "5. Лист «Fazer & USDT» — сколько залить на Fazer и сколько вывести себе.",
  "",
  "Важно:",
  "• Себестоимость (опт) — из админки Zynqo: amountUsd × курс, или вручную в колонке «Опт USD».",
  "• Steam: наценка сайта = только комиссия Steam, не общая наценка.",
  "• Фикс 3 USDT и 2.75 USDT — за операцию, не за заказ. Указывайте число операций на листе «Период».",
  "",
  "Файл можно копировать каждый месяц (Файл → Сохранить как).",
];
helpLines.forEach((line, i) => {
  const row = wsHelp.getRow(i + 1);
  row.getCell(1).value = line;
  if (i === 0) row.font = { bold: true, size: 14 };
});

// ─── Sheet: Настройки ──────────────────────────────────────────────
const wsSet = wb.addWorksheet("Настройки");
wsSet.columns = [{ width: 36 }, { width: 18 }, { width: 40 }];
wsSet.addRow(["Параметр", "Значение", "Комментарий"]).font = { bold: true };
const settings = [
  ["Курс USD → RUB", 92, "Как в админке Zynqo (USD_RUB_RATE)"],
  ["Наценка сайта, %", 24, "DEFAULT_MARKUP_PCT (кроме Steam)"],
  ["Комиссия Steam, %", 5, "Только пополнение Steam"],
  ["Вывод Freekassa → USDT, USDT", 3, "Фикс за один вывод"],
  ["Пополнение FazerCards, USDT", 2.75, "Фикс за одно пополнение"],
  ["Курс USDT → RUB", 100, "Для перевода USDT-комиссий в рубли"],
];
settings.forEach((r) => wsSet.addRow(r));
wsSet.getCell("B2").numFmt = "#,##0.00";
wsSet.getCell("B3").numFmt = "0";
wsSet.getCell("B4").numFmt = "0";
wsSet.getCell("B5").numFmt = "#,##0.00";
wsSet.getCell("B6").numFmt = "#,##0.00";
wsSet.getCell("B7").numFmt = "#,##0.00";

// Named-ish refs for formulas (row numbers fixed)
const RATE = "'Настройки'!$B$2";
const USDT_RUB = "'Настройки'!$B$7";

// ─── Sheet: Способы оплаты ─────────────────────────────────────────
const wsPay = wb.addWorksheet("Способы оплаты");
wsPay.columns = [
  { width: 22 },
  { width: 14 },
  { width: 14 },
  { width: 36 },
];
wsPay.addRow(["Способ оплаты", "Комиссия %", "Фикс ₽", "Заметка"]).font = { bold: true };
const payMethods = [
  ["СБП", 0.035, 0, "Пример 3.5% — замените на ваш тариф FK"],
  ["Банковская карта (RU)", 0.055, 0, "Пример 5.5%"],
  ["Mir / Mastercard", 0.06, 0, "Пример 6%"],
  ["ЮMoney", 0.05, 0, "Пример 5%"],
  ["Криптовалюта", 0.02, 0, "Пример 2%"],
  ["Другое", 0.05, 0, "Резерв"],
];
payMethods.forEach((r) => {
  const row = wsPay.addRow(r);
  row.getCell(2).numFmt = pctFmt;
  row.getCell(3).numFmt = rubFmt;
});
const payLastRow = payMethods.length + 1;
const payRange = `'Способы оплаты'!$A$2:$A$${payLastRow}`;

// ─── Sheet: Заказы ─────────────────────────────────────────────────
const wsOrd = wb.addWorksheet("Заказы", {
  views: [{ state: "frozen", ySplit: 1 }],
});
wsOrd.columns = [
  { header: "Дата", key: "date", width: 12 },
  { header: "№ заказа", key: "id", width: 14 },
  { header: "Товар", key: "product", width: 22 },
  { header: "Способ оплаты", key: "pay", width: 20 },
  { header: "Выручка ₽", key: "rev", width: 12 },
  { header: "Опт USD", key: "usd", width: 10 },
  { header: "Опт ₽", key: "cost", width: 12 },
  { header: "FK %", key: "fkPct", width: 8 },
  { header: "FK комиссия ₽", key: "fkFee", width: 14 },
  { header: "Маржа ₽", key: "margin", width: 12 },
  { header: "Чисто ₽", key: "net", width: 12 },
];
wsOrd.getRow(1).font = { bold: true };

for (let r = 2; r <= 502; r++) {
  wsOrd.getCell(`F${r}`).numFmt = usdFmt;
  wsOrd.getCell(`G${r}`).numFmt = rubFmt;
  wsOrd.getCell(`E${r}`).numFmt = rubFmt;
  wsOrd.getCell(`I${r}`).numFmt = rubFmt;
  wsOrd.getCell(`J${r}`).numFmt = rubFmt;
  wsOrd.getCell(`K${r}`).numFmt = rubFmt;

  // Опт ₽ = Опт USD × курс
  wsOrd.getCell(`G${r}`).value = { formula: `IF(F${r}="","",F${r}*${RATE})` };
  // FK % = VLOOKUP способ оплаты
  wsOrd.getCell(`H${r}`).value = {
    formula: `IF(D${r}="","",IFERROR(VLOOKUP(D${r},'Способы оплаты'!$A$2:$B$${payLastRow},2,FALSE),0))`,
  };
  wsOrd.getCell(`H${r}`).numFmt = pctFmt;
  // FK комиссия
  wsOrd.getCell(`I${r}`).value = {
    formula: `IF(E${r}="","",E${r}*H${r}+IFERROR(VLOOKUP(D${r},'Способы оплаты'!$A$2:$C$${payLastRow},3,FALSE),0))`,
  };
  // Маржа = выручка - опт
  wsOrd.getCell(`J${r}`).value = { formula: `IF(E${r}="","",E${r}-G${r})` };
  // Чисто = маржа - FK
  wsOrd.getCell(`K${r}`).value = { formula: `IF(E${r}="","",J${r}-I${r})` };

  wsOrd.getCell(`D${r}`).dataValidation = {
    type: "list",
    allowBlank: true,
    formulae: [payRange],
    showErrorMessage: true,
    errorTitle: "Способ оплаты",
    error: "Выберите из списка на листе «Способы оплаты»",
  };
}

// Example rows
wsOrd.addRow(["22.06.2026", "ZYN-ABC123", "Telegram Premium 3м", "СБП", 4500, 38.5]);
wsOrd.addRow(["22.06.2026", "ZYN-DEF456", "Steam 1000₽", "Банковская карта (RU)", 1050, 10.87]);
wsOrd.addRow(["22.06.2026", "ZYN-GHI789", "PUBG UC", "СБП", 890, 7.2]);

// ─── Sheet: Период ─────────────────────────────────────────────────
const wsPer = wb.addWorksheet("Период");
wsPer.columns = [{ width: 32 }, { width: 18 }, { width: 40 }];
wsPer.addRow(["Показатель", "Значение", "Формула / пояснение"]).font = { bold: true };

const periodRows = [
  ["Период с", new Date(2026, 5, 1), "Дата начала (вручную)"],
  ["Период по", new Date(2026, 5, 30), "Дата конца (вручную)"],
  ["", "", ""],
  ["Заказов (с данными)", { formula: 'COUNTA(Заказы!E2:E502)' }, ""],
  ["Выручка ₽", { formula: "SUM(Заказы!E2:E502)" }, "Сумма оплат клиентов"],
  ["Себестоимость (опт) ₽", { formula: "SUM(Заказы!G2:G502)" }, "FazerCards wholesale"],
  ["Комиссия Freekassa ₽", { formula: "SUM(Заказы!I2:I502)" }, "По % каждого способа"],
  ["Маржа до USDT ₽", { formula: "B8-B9-B10" }, "Выручка − опт − FK"],
  ["", "", ""],
  ["Выводов FK → USDT (шт)", 1, "Сколько раз выводили за период"],
  ["Пополнений Fazer (шт)", 1, "Сколько раз пополняли Fazer"],
  ["USDT комиссии ₽", { formula: `B13*'Настройки'!B6*${USDT_RUB}+B14*'Настройки'!B7*${USDT_RUB}` }, "3 + 2.75 USDT × курс"],
  ["Прочие расходы ₽", 0, "Сервер, домен, реклама"],
  ["", "", ""],
  ["ЧИСТЫЙ ДОХОД ₽", { formula: "B11-B12-B15" }, "Можно оставить себе"],
  ["Маржа % от выручки", { formula: "IF(B8=0,0,B16/B8)" }, ""],
];
periodRows.forEach((r, i) => {
  const row = wsPer.getRow(i + 2);
  row.getCell(1).value = r[0];
  row.getCell(2).value = r[1];
  row.getCell(3).value = r[2];
});
wsPer.getCell("B16").font = { bold: true, size: 12 };
wsPer.getCell("B8").numFmt = rubFmt;
wsPer.getCell("B9").numFmt = rubFmt;
wsPer.getCell("B10").numFmt = rubFmt;
wsPer.getCell("B11").numFmt = rubFmt;
wsPer.getCell("B12").numFmt = rubFmt;
wsPer.getCell("B15").numFmt = rubFmt;
wsPer.getCell("B16").numFmt = rubFmt;
wsPer.getCell("B17").numFmt = pctFmt;
wsPer.getCell("B4").numFmt = "dd.mm.yyyy";
wsPer.getCell("B5").numFmt = "dd.mm.yyyy";

// ─── Sheet: Fazer & USDT ───────────────────────────────────────────
const wsFaz = wb.addWorksheet("Fazer & USDT");
wsFaz.columns = [{ width: 38 }, { width: 16 }, { width: 36 }];
wsFaz.addRow(["Расчёт", "Значение", "Пояснение"]).font = { bold: true };
const fazerRows = [
  ["Оборот за 3 дня ₽", 50000, "Ожидаемая выручка"],
  ["Доля опта от выручки, %", 0.82, "≈100% − наценка; 0.82 при ~22% маржи"],
  ["Нужно на Fazer ₽", { formula: "B2*B3" }, ""],
  ["Нужно на Fazer USD", { formula: `B4/${RATE}` }, ""],
  ["Уже на балансе Fazer USD", 150, "Текущий баланс из health/admin"],
  ["Долить Fazer USD", { formula: "MAX(0,B5-B6)" }, "Одним пополнением"],
  ["", "", ""],
  ["После оплаты Fazer остаётся ₽", { formula: "B2-B4" }, "Грубо: выручка − опт"],
  ["Минус FK (средний %)", { formula: "B9*0.05" }, "Замените 5% на ваш средний"],
  ["Минус USDT (1+1 операция) ₽", { formula: `('Настройки'!B6+'Настройки'!B7)*${USDT_RUB}` }, ""],
  ["К выводу себе ₽", { formula: "B9-B10-B11" }, ""],
];
fazerRows.forEach((r, i) => {
  const row = wsFaz.getRow(i + 2);
  row.getCell(1).value = r[0];
  row.getCell(2).value = r[1];
  row.getCell(3).value = r[2];
});
wsFaz.getCell("B2").numFmt = rubFmt;
wsFaz.getCell("B3").numFmt = pctFmt;
wsFaz.getCell("B4").numFmt = rubFmt;
wsFaz.getCell("B5").numFmt = usdFmt;
wsFaz.getCell("B6").numFmt = usdFmt;
wsFaz.getCell("B7").numFmt = usdFmt;
wsFaz.getCell("B9").numFmt = rubFmt;
wsFaz.getCell("B10").numFmt = rubFmt;
wsFaz.getCell("B11").numFmt = rubFmt;
wsFaz.getCell("B12").numFmt = rubFmt;

await wb.xlsx.writeFile(outPath);
console.log("Created:", outPath);
