import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET() {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const [row] = await sql`SELECT student_verified, edu_email FROM users WHERE clerk_id = ${userId}`;
  return Response.json({ student_verified: row?.student_verified ?? false, edu_email: row?.edu_email ?? null });
}
export async function POST(req) {
  const { userId } = auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const sql = getDb();
  const { edu_email } = await req.json();
  if (!edu_email?.endsWith(".edu")) return Response.json({ error: "Must be a valid .edu email address." }, { status: 400 });
  await sql`INSERT INTO users (clerk_id, edu_email, student_verified) VALUES (${userId}, ${edu_email}, true) ON CONFLICT (clerk_id) DO UPDATE SET edu_email = ${edu_email}, student_verified = true`;
  return Response.json({ ok: true });
}
