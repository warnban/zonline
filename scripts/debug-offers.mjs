import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const base = process.env.FAZER_API_BASE_URL || "https://api.fzr.cards/api/v2";
const headers = { "X-Api-Key": process.env.FAZER_API_KEY };

const gift = await p.catalogCategory.findFirst({ where: { type: "gift_card" } });
const key = await p.catalogCategory.findFirst({ where: { type: "game_key" } });

for (const [label, cat, path] of [
  ["gift", gift, "giftcards/cards"],
  ["key", key, "gamekeys/keys"],
] ) {
  if (!cat) continue;
  const res = await fetch(`${base}/${path}?category_id=${cat.id}`, { headers });
  const json = await res.json();
  console.log(label, "keys", Object.keys(json), "sample array key", json.items ? "items" : json.cards ? "cards" : json.offers ? "offers" : "?");
}

await p.$disconnect();
