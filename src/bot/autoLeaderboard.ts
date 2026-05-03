import { type Client, EmbedBuilder, TextChannel } from "discord.js";
import { getLeaderboard, getConfig, setConfig } from "./db";
import { logger } from "../lib/logger";

const INTERVAL_MS = 5 * 60 * 1000;

export function startAutoLeaderboard(client: Client) {
  const run = async () => {
    try {
      const channelId = await getConfig("leaderboard_channel_id");
      if (!channelId) return;

      const channel = client.channels.cache.get(channelId) as TextChannel | undefined;
      if (!channel || !channel.isSendable()) return;

      const leaders = await getLeaderboard();
      const embed = buildLeaderboardEmbed(leaders);

      const existingMsgId = await getConfig("leaderboard_message_id");

      if (existingMsgId) {
        try {
          const msg = await channel.messages.fetch(existingMsgId);
          await msg.edit({ embeds: [embed], content: "" });
          return;
        } catch {
        }
      }

      const newMsg = await channel.send({ embeds: [embed] });
      await setConfig("leaderboard_message_id", newMsg.id);
      logger.info({ messageId: newMsg.id }, "Leaderboard message created");
    } catch (err) {
      logger.error({ err }, "Auto leaderboard update failed");
    }
  };

  setTimeout(() => {
    run();
    setInterval(run, INTERVAL_MS);
  }, 10_000);

  logger.info("Auto leaderboard started (every 5 minutes)");
}

export function buildLeaderboardEmbed(leaders: any[]) {
  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

  const description =
    leaders.length === 0
      ? "لا يوجد لاعبون بعد!"
      : leaders
          .map((u: any, i: number) => {
            const totalValue = u.gold * 100 + u.silver * 10 + u.bronze;
            return (
              `${medals[i]} **${u.username}**\n` +
              `> 🥇 ${u.gold} | 🥈 ${u.silver} | 🥉 ${u.bronze}  •  *(${totalValue.toLocaleString()} نقطة)*`
            );
          })
          .join("\n\n");

  const now = new Date().toLocaleString("ar-SA", {
    timeZone: "Asia/Riyadh",
    dateStyle: "short",
    timeStyle: "short",
  });

  return new EmbedBuilder()
    .setTitle("🏆 قائمة الأثرياء — Nova Coin")
    .setDescription(description)
    .setColor("#FFD700")
    .addFields({ name: "⏱️ آخر تحديث", value: now, inline: true })
    .setFooter({ text: "Nova Coin • يتحدث تلقائياً كل 5 دقائق" })
    .setTimestamp();
}
