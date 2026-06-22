import type { Metadata } from "next";
import { SteamLandingView } from "@/components/pages/steam-landing-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Пополнение Steam",
  description: "Пополните кошелёк Steam по логину из России.",
};

export default function SteamPage() {
  return <SteamLandingView />;
}
