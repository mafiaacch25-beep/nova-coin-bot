import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let tablesCreated = false;

export async function ensureTables() {
  if (tablesCreated) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nova_users (
      id SERIAL PRIMARY KEY,
      discord_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      gold INTEGER NOT NULL DEFAULT 0,
      silver INTEGER NOT NULL DEFAULT 0,
      bronze INTEGER NOT NULL DEFAULT 0,
      custom_name TEXT,
      custom_color TEXT,
      background TEXT,
      github_token TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nova_transactions (
      id SERIAL PRIMARY KEY,
      discord_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      coin_type TEXT NOT NULL,
      type TEXT NOT NULL,
      reason TEXT NOT NULL,
      operator_id TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nova_bot_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS nova_daily_checkin (
      id SERIAL PRIMARY KEY,
      discord_id TEXT NOT NULL,
      username TEXT NOT NULL,
      checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE(discord_id, checkin_date)
    );

    CREATE TABLE IF NOT EXISTS nova_activity (
      discord_id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      total_points INTEGER NOT NULL DEFAULT 0,
      rewarded_milestones INTEGER NOT NULL DEFAULT 0,
      last_message_at TIMESTAMP,
      messages_count INTEGER NOT NULL DEFAULT 0,
      reactions_count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
  `);
  tablesCreated = true;
}

export async function addActivityPoints(
  discordId: string,
  username: string,
  points: number,
  source: "message" | "reaction" | "interaction"
): Promise<{ milestoneReached: boolean; newMilestone: number; totalPoints: number }> {
  const countCol = source === "message" ? "messages_count" : source === "reaction" ? "reactions_count" : "messages_count";

  const result = await pool.query(
    `INSERT INTO nova_activity (discord_id, username, total_points, ${countCol}, last_message_at)
     VALUES ($1, $2, $3, 1, NOW())
     ON CONFLICT (discord_id) DO UPDATE SET
       username = $2,
       total_points = nova_activity.total_points + $3,
       ${countCol} = nova_activity.${countCol} + 1,
       last_message_at = CASE WHEN $4 = 'message' THEN NOW() ELSE nova_activity.last_message_at END,
       updated_at = NOW()
     RETURNING total_points, rewarded_milestones`,
    [discordId, username, points, source]
  );

  const row = result.rows[0];
  const currentMilestone = Math.floor(row.total_points / 1000);

  if (currentMilestone > row.rewarded_milestones) {
    await pool.query(
      "UPDATE nova_activity SET rewarded_milestones = $1 WHERE discord_id = $2",
      [currentMilestone, discordId]
    );
    await getOrCreateUser(discordId, username);
    await pool.query(
      "UPDATE nova_users SET silver = silver + 5 WHERE discord_id = $1",
      [discordId]
    );
    await pool.query(
      "INSERT INTO nova_transactions (discord_id, amount, coin_type, type, reason) VALUES ($1, $2, $3, $4, $5)",
      [discordId, 5, "silver", "add", `مكافأة النشاط — ${currentMilestone * 1000} نقطة`]
    );
    return { milestoneReached: true, newMilestone: currentMilestone, totalPoints: row.total_points };
  }

  return { milestoneReached: false, newMilestone: row.rewarded_milestones, totalPoints: row.total_points };
}

export async function getActivity(discordId: string) {
  const result = await pool.query(
    "SELECT * FROM nova_activity WHERE discord_id = $1",
    [discordId]
  );
  return result.rows[0] || null;
}

export function getDailyDate(): string {
  const now = new Date();
  const riyadh = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  if (riyadh.getHours() < 1) {
    riyadh.setDate(riyadh.getDate() - 1);
  }
  return riyadh.toISOString().slice(0, 10);
}

export async function claimDaily(discordId: string, username: string): Promise<{ success: boolean; alreadyClaimed?: boolean }> {
  const date = getDailyDate();
  try {
    await getOrCreateUser(discordId, username);
    await pool.query(
      "INSERT INTO nova_daily_checkin (discord_id, username, checkin_date) VALUES ($1, $2, $3)",
      [discordId, username, date]
    );
    await pool.query(
      "UPDATE nova_users SET silver = silver + 1 WHERE discord_id = $1",
      [discordId]
    );
    await pool.query(
      "INSERT INTO nova_transactions (discord_id, amount, coin_type, type, reason) VALUES ($1, $2, $3, $4, $5)",
      [discordId, 1, "silver", "add", "مكافأة تسجيل الدخول اليومي"]
    );
    return { success: true };
  } catch (e: any) {
    if (e.code === "23505") return { success: false, alreadyClaimed: true };
    throw e;
  }
}

export async function hasClaimed(discordId: string): Promise<boolean> {
  const date = getDailyDate();
  const r = await pool.query(
    "SELECT 1 FROM nova_daily_checkin WHERE discord_id = $1 AND checkin_date = $2",
    [discordId, date]
  );
  return r.rows.length > 0;
}

export async function getDailyCount(date?: string): Promise<number> {
  const d = date || getDailyDate();
  const r = await pool.query("SELECT COUNT(*) FROM nova_daily_checkin WHERE checkin_date = $1", [d]);
  return parseInt(r.rows[0].count);
}

export async function getUserStats(discordId: string) {
  const [coinsEarned, dailyCount] = await Promise.all([
    pool.query(
      "SELECT coin_type, SUM(amount) as total FROM nova_transactions WHERE discord_id=$1 AND type='add' GROUP BY coin_type",
      [discordId]
    ),
    pool.query(
      "SELECT COUNT(*) as count FROM nova_daily_checkin WHERE discord_id=$1",
      [discordId]
    ),
  ]);

  const earned: Record<string, number> = { gold: 0, silver: 0, bronze: 0 };
  for (const row of coinsEarned.rows) earned[row.coin_type] = parseInt(row.total);

  return {
    earnedGold: earned.gold,
    earnedSilver: earned.silver,
    earnedBronze: earned.bronze,
    totalDailyCheckins: parseInt(dailyCount.rows[0].count),
  };
}

export async function getActivityLeaderboard() {
  const result = await pool.query(
    "SELECT discord_id, username, total_points, messages_count, reactions_count, rewarded_milestones FROM nova_activity ORDER BY total_points DESC LIMIT 10"
  );
  return result.rows;
}

export async function getOrCreateUser(discordId: string, username: string) {
  const existing = await pool.query(
    "SELECT * FROM nova_users WHERE discord_id = $1",
    [discordId]
  );
  if (existing.rows.length > 0) return existing.rows[0];
  const result = await pool.query(
    "INSERT INTO nova_users (discord_id, username) VALUES ($1, $2) RETURNING *",
    [discordId, username]
  );
  return result.rows[0];
}

export async function getUser(discordId: string) {
  const result = await pool.query(
    "SELECT * FROM nova_users WHERE discord_id = $1",
    [discordId]
  );
  return result.rows[0] || null;
}

export async function updateCoins(
  discordId: string,
  coinType: "gold" | "silver" | "bronze",
  amount: number,
  type: "add" | "remove",
  reason: string,
  operatorId?: string
) {
  const op = type === "add" ? "+" : "-";
  await pool.query(
    `UPDATE nova_users SET ${coinType} = GREATEST(0, ${coinType} ${op} $1) WHERE discord_id = $2`,
    [amount, discordId]
  );
  await pool.query(
    "INSERT INTO nova_transactions (discord_id, amount, coin_type, type, reason, operator_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [discordId, amount, coinType, type, reason, operatorId || null]
  );
}

export async function transferCoins(
  fromId: string,
  toId: string,
  toUsername: string,
  coinType: "gold" | "silver" | "bronze",
  amount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const from = await getUser(fromId);
  if (!from) return { success: false, error: "حسابك غير موجود" };
  if (from[coinType] < amount) return { success: false, error: `رصيدك غير كافٍ، لديك ${from[coinType]} فقط` };

  await getOrCreateUser(toId, toUsername);

  await pool.query(
    `UPDATE nova_users SET ${coinType} = ${coinType} - $1 WHERE discord_id = $2`,
    [amount, fromId]
  );
  await pool.query(
    `UPDATE nova_users SET ${coinType} = ${coinType} + $1 WHERE discord_id = $2`,
    [amount, toId]
  );
  await pool.query(
    "INSERT INTO nova_transactions (discord_id, amount, coin_type, type, reason, operator_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [fromId, amount, coinType, "remove", reason, toId]
  );
  await pool.query(
    "INSERT INTO nova_transactions (discord_id, amount, coin_type, type, reason, operator_id) VALUES ($1, $2, $3, $4, $5, $6)",
    [toId, amount, coinType, "add", reason, fromId]
  );
  return { success: true };
}

export async function getLeaderboard() {
  const result = await pool.query(
    `SELECT discord_id, username, gold, silver, bronze,
      (gold * 100 + silver * 10 + bronze) as total_value
    FROM nova_users
    ORDER BY total_value DESC
    LIMIT 10`
  );
  return result.rows;
}

export async function getTransactions(discordId: string) {
  const result = await pool.query(
    "SELECT * FROM nova_transactions WHERE discord_id = $1 ORDER BY created_at DESC LIMIT 10",
    [discordId]
  );
  return result.rows;
}

export async function setConfig(key: string, value: string) {
  await pool.query(
    "INSERT INTO nova_bot_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2",
    [key, value]
  );
}

export async function getConfig(key: string): Promise<string | null> {
  const result = await pool.query(
    "SELECT value FROM nova_bot_config WHERE key = $1",
    [key]
  );
  return result.rows[0]?.value || null;
}

export async function purchaseCustomize(
  buyerId: string,
  buyerUsername: string,
  selloraaId: string,
  selloraaUsername: string,
  coinType: "gold" | "silver" | "bronze",
  amount: number,
  type: "background" | "color" | "name",
  value: string
): Promise<{ success: boolean; error?: string }> {
  const transfer = await transferCoins(
    buyerId,
    selloraaId,
    selloraaUsername,
    coinType,
    amount,
    `شراء تخصيص: ${type}`
  );
  if (!transfer.success) return transfer;

  let col = "";
  if (type === "background") col = "background";
  else if (type === "color") col = "custom_color";
  else if (type === "name") col = "custom_name";

  await pool.query(
    `UPDATE nova_users SET ${col} = $1 WHERE discord_id = $2`,
    [value, buyerId]
  );

  return { success: true };
}

const SHOP_ITEMS = [
  { id: 1, name: "🎖️ رتبة خاصة", description: "رتبة حصرية وخاصة", price: 5, priceType: "gold" as const },
];

export function getShopItem(itemId: number) {
  return SHOP_ITEMS.find(item => item.id === itemId);
}

export async function buyItem(
  userId: string,
  itemId: number
): Promise<{ success: boolean; error?: string; item?: any }> {
  const item = getShopItem(itemId);
  if (!item) return { success: false, error: "العنصر غير موجود" };

  const user = await getUser(userId);
  if (!user) return { success: false, error: "حسابك غير موجود" };

  const balance = user[item.priceType];
  if (balance < item.price) {
    return { success: false, error: `رصيدك غير كافٍ. تحتاج ${item.price} 🏆 ذهبية، لديك ${balance} فقط` };
  }

  await updateCoins(userId, item.priceType, item.price, "remove", `شراء: ${item.name}`);
  
  return { success: true, item };
}

export { pool };
