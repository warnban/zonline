import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const cat = await p.catalogCategory.findFirst({ where: { type: "topup", enabled: true } });
console.log("category", cat?.id, cat?.name);

if (cat && process.env.FAZER_API_KEY) {
  const base = process.env.FAZER_API_BASE_URL || "https://api.fzr.cards/api/v2";
  const res = await fetch(`${base}/topups/offers?category_id=${cat.id}`, {
    headers: { "X-Api-Key": process.env.FAZER_API_KEY },
  });
  const text = await res.text();
  console.log("status", res.status);
  console.log(text.slice(0, 2000));
}

await p.$disconnect();
