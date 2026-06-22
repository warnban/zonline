import { NextResponse } from "next/server";
import { syncCatalogFromFazer } from "@/lib/catalog/sync";

export async function POST() {
  const result = await syncCatalogFromFazer();
  return NextResponse.json(result);
}
