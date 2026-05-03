import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getActivity, getUserStats, getDailyDate, hasClaimed } from "../db";
import type { Command } from "../index";

function getRank(totalValue: number): string {
  if (totalValue >= 10000) return "💎 أسطوري";
  if (totalValue >= 5000)  return "👑 ملكي";
  if (totalValue >= 1000)  return "🌟 نجم";
  if (totalValue >= 500)   return "⚡ متقدم";
  if (totalValue >= 100)   return "🔰 عادي";
  return "🆕 مبتدئ";
}

export const meCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-me")
    .setDescription("اعرض حسابك الكامل — عملاتك وXP ونشاطك وكل شيء")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("مستخدم آخر (اختياري)").setRequired(false)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const target = interaction.options.getUser("user") || interaction.user;
    const isSelf = target.id === interaction.user.id;

    const [user, activity, stats, claimed] = await Promise.all([
      getOrCreateUser(target.id, target.username),
      getActivity(target.id),
      getUserStats(target.id),
      isSelf ? hasClaimed(target.id) : Promise.resolve(null),
    ]);

    const totalValue = user.gold * 100 + user.silver * 10 + user.bronze;
    const rank = getRank(totalValue);

    const xpTotal = activity?.total_points ?? 0;
    const xpMilestones = activity?.rewarded_milestones ?? 0;

    const embed = new EmbedBuilder()
      .setTitle(`📋 حساب ${user.custom_name || target.displayName}`)
      .setColor((user.custom_color as `#${string}`) || "#5865F2")
      .setThumbnail(target.displayAvatarURL({ size: 256 }))

      .addFields({
        name: "💰 الرصيد الحالي",
        value:
          `🥇 **${user.gold}** ذهبية  |  🥈 **${user.silver}** فضية  |  🥉 **${user.bronze}** برونزية\n` +
          `القيمة الإجمالية: **${totalValue.toLocaleString()}** نقطة`,
        inline: false,
      })

      .addFields(
        { name: "🏅 الرتبة", value: rank, inline: true },
        { name: "📅 عضو منذ", value: new Date(user.created_at).toLocaleDateString("ar-SA"), inline: true },
      )

      .addFields({
        name: `⭐ نقاط الخبرة (XP) — ${xpTotal.toLocaleString()} نقطة`,
        value:
          `مراحل مكتملة: **${xpMilestones}**  |  💬 رسائل: **${activity?.messages_count ?? 0}**`,
        inline: false,
      })

      .addFields({
        name: "🤖 ما اكتسبته من البوت",
        value:
          `🥇 ${stats.earnedGold} ذهبية  |  🥈 ${stats.earnedSilver} فضية  |  🥉 ${stats.earnedBronze} برونزية\n` +
          `🗓️ أيام تسجيل الدخول: **${stats.totalDailyCheckins}** يوم`,
        inline: false,
      });

    if (isSelf) {
      embed.addFields({
        name: "🌅 تسجيل الدخول اليومي",
        value: claimed
          ? `✅ سجّلت دخولك اليوم (${getDailyDate()})`
          : `❌ لم تسجّل بعد — استخدم \`/daily-reward\`!`,
        inline: false,
      });
    }

    embed.setFooter({ text: "Nova Coin System" }).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
