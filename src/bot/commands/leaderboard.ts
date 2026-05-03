import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getLeaderboard } from "../db";
import type { Command } from "../index";

export const leaderboardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-leaderboard")
    .setDescription("اعرض أغنى 10 مستخدمين"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const leaders = await getLeaderboard();

    const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

    const description = leaders.length === 0
      ? "لا يوجد مستخدمون بعد!"
      : leaders.map((u: any, i: number) => {
          const line = `${medals[i]} **${u.username}**`;
          const coins = `🥇 ${u.gold} | 🥈 ${u.silver} | 🥉 ${u.bronze}`;
          const val = `*(${u.total_value} نقطة)*`;
          return `${line}\n${coins} ${val}`;
        }).join("\n\n");

    const embed = new EmbedBuilder()
      .setTitle("🏆 لوحة الأثرياء - Nova Coin")
      .setDescription(description)
      .setColor("#FFD700")
      .setFooter({ text: "Nova Coin System • الترتيب: ذهبية×100 + فضية×10 + برونزية×1" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
