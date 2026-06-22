import type { Metadata } from "next";
import { TelegramPremiumView } from "@/components/pages/telegram-premium-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Telegram Premium",
  description: "Подписка Telegram Premium на 3, 6 или 12 месяцев.",
};

export default function Page() {
  return <TelegramPremiumView />;
}
