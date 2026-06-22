import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/session";

export async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
