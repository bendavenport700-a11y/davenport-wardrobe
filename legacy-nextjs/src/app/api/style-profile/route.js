import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const [row] = await sql`SELECT style_profile FROM users WHERE clerk_id = ${userId}`;
  return Response.json({ style_profile: row?.style_profile ?? null });
}
export async function POST(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const { style_profile } = await req.json();
  await sql`INSERT INTO users (clerk_id, style_profile) VALUES (${userId}, ${JSON.stringify(style_profile)}) ON CONFLICT (clerk_id) DO UPDATE SET style_profile = ${JSON.stringify(style_profile)}`;
  return Response.json({ ok: true });
}
