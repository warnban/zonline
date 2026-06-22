import { NextResponse } from "next/server";
import { requireAdminSession, unauthorizedResponse } from "@/lib/admin/require";
import { syncCatalogFromFazer } from "@/lib/catalog/sync";

export async function POST() {
  if (!(await requireAdminSession())) return unauthorizedResponse();

  const result = await syncCatalogFromFazer();
  return NextResponse.json(result);
}
