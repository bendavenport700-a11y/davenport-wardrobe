import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const sql = getDb();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT UNIQUE NOT NULL,
        email TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        category TEXT,
        price INTEGER NOT NULL,
        rent_price INTEGER DEFAULT 0,
        description TEXT,
        image_url TEXT,
        stock INTEGER DEFAULT 1,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS rent_price INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS points_history (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        stripe_session_id TEXT UNIQUE,
        inventory_id INTEGER REFERENCES inventory(id),
        amount INTEGER,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        clerk_id TEXT NOT NULL,
        user_name TEXT,
        user_image TEXT,
        caption TEXT NOT NULL,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        likes INTEGER DEFAULT 0
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wardrobes (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO wardrobes (name, description) VALUES
        ('Campus Casual',   'Everyday college fits for class, the dining hall, and everywhere in between.'),
        ('Business Casual', 'Sharp enough for the office, comfortable enough for a long day.'),
        ('Going Out',       'Dark tones, clean fits, and pieces that get noticed.'),
        ('Weekend',         'Relaxed fits that still look intentional.'),
        ('Internship',      'Everything you need to show up and stand out on day one.')
      ON CONFLICT (name) DO NOTHING
    `;

    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wardrobe_id INTEGER REFERENCES wardrobes(id)`;
    await sql`ALTER TABLE wardrobes ADD COLUMN IF NOT EXISTS image_url TEXT`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS size TEXT`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS condition TEXT`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS wears TEXT`;

    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS occasion TEXT`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS style TEXT`;
    await sql`ALTER TABLE inventory ADD COLUMN IF NOT EXISTS season TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS style_profile JSONB`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS student_verified BOOLEAN DEFAULT false`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS edu_email TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;

    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_subscription_item_id TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_deposit_intent_id TEXT`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS months_rented INTEGER DEFAULT 0`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_buyout_price INTEGER`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_buyout_price INTEGER`;
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS security_deposit_intent_id TEXT`;

    return Response.json({ ok: true, message: "Tables created." });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
