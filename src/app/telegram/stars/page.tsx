import type { Metadata } from "next";
import { TelegramStarsView } from "@/components/pages/telegram-stars-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Telegram Stars",
  description: "Купить Telegram Stars по username.",
};

export default function Page() {
  return <TelegramStarsView />;
}
