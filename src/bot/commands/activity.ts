import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getActivity, getActivityLeaderboard, getOrCreateUser } from "../db";
import type { Command } from "../index";

export const activityCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-activity")
    .setDescription("اعرض نقاط نشاطك أو لوحة الأكثر نشاطاً")
    .addSubcommand((sub) =>
      sub.setName("me").setDescription("نقاط نشاطك الشخصية")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("مستخدم آخر (اختياري)").setRequired(false)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("top").setDescription("أكثر 10 مستخدمين نشاطاً")
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const sub = interaction.options.getSubcommand();

    if (sub === "me") {
      const target = interaction.options.getUser("user") || interaction.user;
      await getOrCreateUser(target.id, target.username);
      const activity = await getActivity(target.id);

      const totalPoints = activity?.total_points ?? 0;
      const milestones = activity?.rewarded_milestones ?? 0;

      const embed = new EmbedBuilder()
        .setTitle(`📊 نشاط ${target.displayName}`)
        .setColor("#3498DB")
        .setThumbnail(target.displayAvatarURL())
        .addFields(
          { name: "⭐ إجمالي النقاط", value: `**${totalPoints.toLocaleString()}** نقطة`, inline: true },
          { name: "🏆 المراحل المكتملة", value: `**${milestones}** مرحلة`, inline: true },
          { name: "🥈 مكافآت مستلمة", value: `**${milestones * 5}** فضية`, inline: true },
          {
            name: "📋 التفاصيل",
            value:
              `💬 رسائل محسوبة: **${activity?.messages_count ?? 0}**\n` +
              `👍 تفاعلات: **${activity?.reactions_count ?? 0}**`,
          },
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === "top") {
      const leaders = await getActivityLeaderboard();
      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];

      const description = leaders.length === 0
        ? "لا يوجد مستخدمون بعد!"
        : leaders
            .map((u: any, i: number) => {
              const line = `${medals[i]} **${u.username}**`;
              const stats = `${u.total_points.toLocaleString()} نقطة`;
              return `${line}\n> ${stats}`;
            })
            .join("\n\n");

      const embed = new EmbedBuilder()
        .setTitle("🔥 أكثر 10 مستخدمين نشاطاً")
        .setDescription(description)
        .setColor("#FF6B6B")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
