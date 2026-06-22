import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashPassword } from "@/lib/admin/password";

const bootstrapSchema = z.object({
  secret: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().max(120).optional(),
});

export async function POST(request: Request) {
  if (!env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "bootstrap disabled" }, { status: 503 });
  }

  const body = await request.json();
  const parsed = bootstrapSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (parsed.data.secret !== env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const count = await db.adminUser.count();
  if (count > 0) {
    return NextResponse.json({ error: "admin already exists" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const admin = await db.adminUser.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      name: parsed.data.name?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, email: admin.email });
}
