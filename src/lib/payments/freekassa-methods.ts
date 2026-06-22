/** Способы оплаты Freekassa API (параметр `i`). */
export type FreekassaPaymentMethod = {
  id: number;
  code: string;
  label: string;
  /** Подпись для клиента (крипта — без комиссии FK) */
  feeNote?: string;
  /** Мин. сумма в USDT для крипто-методов */
  minUsdt?: number;
  crypto?: boolean;
};

export const FREEKASSA_PAYMENT_METHODS: FreekassaPaymentMethod[] = [
  {
    id: 44,
    code: "sbp",
    label: "СБП",
  },
  {
    id: 36,
    code: "card_ru",
    label: "Банковские карты РФ",
  },
  {
    id: 15,
    code: "usdt_trc20",
    label: "USDT (TRC-20)",
    feeNote: "Без комиссии платёжного сервиса",
    minUsdt: 2.5,
    crypto: true,
  },
  {
    id: 45,
    code: "ton",
    label: "TON",
    feeNote: "Без комиссии платёжного сервиса",
    crypto: true,
  },
];

export const DEFAULT_FREEKASSA_METHOD_ID = 44;

export function getFreekassaMethod(id: number): FreekassaPaymentMethod | undefined {
  return FREEKASSA_PAYMENT_METHODS.find((m) => m.id === id);
}

export function isValidFreekassaMethodId(id: number): boolean {
  return FREEKASSA_PAYMENT_METHODS.some((m) => m.id === id);
}
