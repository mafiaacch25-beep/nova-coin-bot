import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, claimDaily, hasClaimed, getDailyDate, getDailyCount } from "../db";
import type { Command } from "../index";

const QUOTES = [
  "كن كالنجوم — حتى في أحلك الليالي تُضيء.",
  "لا تتوقف عن السعي، فالنجاح ليس بعيداً.",
  "كل يوم جديد هو فرصة جديدة لتكون أفضل.",
  "الثبات مفتاح النجاح، والمثابرة طريق التميز.",
  "احلم بكبر، وابدأ بصغر، وتحرك الآن.",
  "النجاح يحب الصبر، والصبر يحب الإصرار.",
  "أنت أقوى مما تظن، وأقرب للنجاح مما تتخيل.",
];

const FLOWER_COLORS = [
  { emoji: "🌹", color: "#FF1493" },  // وردة حمراء - وردي
  { emoji: "🌺", color: "#FF69B4" },  // وردة استوائية - وردي فاقع
  { emoji: "🌸", color: "#FFB6C1" },  // زهرة كرز - وردي فاتح
  { emoji: "🌼", color: "#FFD700" },  // عباد الشمس - ذهبي
  { emoji: "🌻", color: "#FFA500" },  // دوّارة الشمس - برتقالي
  { emoji: "🌷", color: "#FF6347" },  // زنبق - أحمر
  { emoji: "💐", color: "#FF1493" },  // باقة - وردي
];

export const dailyRewardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("daily-reward")
    .setDescription("سجّل دخولك اليومي واحصل على 🥈 1 فضية (مرة واحدة يومياً بعد الساعة 1 صباحاً)"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    await getOrCreateUser(interaction.user.id, interaction.user.username);

    const nowRiyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
    if (nowRiyadh.getHours() < 1) {
      const embed = new EmbedBuilder()
        .setTitle("⏰ ⏰ ⏰ ليس الوقت بعد! ⏰ ⏰ ⏰")
        .setColor("#FF8C00")
        .setDescription(
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "⏳ يمكنك تسجيل الدخول **بعد الساعة 1:00 صباحاً** فقط\n\n" +
          `🕐 الوقت الحالي: **${nowRiyadh.getHours()}:${String(nowRiyadh.getMinutes()).padStart(2, "0")}** بتوقيت الرياض\n` +
          "━━━━━━━━━━━━━━━━━━━━━━"
        )
        .setThumbnail(interaction.user.displayAvatarURL());
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const result = await claimDaily(interaction.user.id, interaction.user.username);

    if (!result.success && result.alreadyClaimed) {
      const embed = new EmbedBuilder()
        .setTitle("✋ ✋ ✋ سجّلت مسبقاً اليوم! ✋ ✋ ✋")
        .setColor("#FF8C00")
        .setDescription(
          "━━━━━━━━━━━━━━━━━━━━━━\n" +
          "😅 لقد سجّلت دخولك اليوم بالفعل\n" +
          "🥈 وأخذت فضيتك!\n\n" +
          "⏰ عُد غداً بعد الساعة 1:00 صباحاً! 🌙\n" +
          "━━━━━━━━━━━━━━━━━━━━━━"
        )
        .setThumbnail(interaction.user.displayAvatarURL());
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const randomFlower = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const totalToday = await getDailyCount();

    const embed = new EmbedBuilder()
      .setTitle(`${randomFlower.emoji}  تسجيل دخول ناجح! 🎉  ${randomFlower.emoji}`)
      .setColor(randomFlower.color)
      .setDescription(
        `✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨\n\n` +
        `💬 **"${randomQuote}"**\n\n` +
        `✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: `${randomFlower.emoji} المكافأة الرائعة ${randomFlower.emoji}`,
          value: `🥈 **1 فضية** أُضيفت لرصيدك!\n⭐ احتفل بتسجيلك اليومي!`,
          inline: false,
        },
        {
          name: `👥 الإحصائيات اليومية`,
          value: `✅ **${totalToday}** لاعب سجّلوا دخولهم اليوم`,
          inline: false,
        },
        {
          name: `📅 معلومات إضافية`,
          value: `🗓️ تاريخ اليوم: ${getDailyDate()}\n⏰ الوقت: ${nowRiyadh.getHours()}:${String(nowRiyadh.getMinutes()).padStart(2, "0")}`,
          inline: false,
        }
      )
      .setFooter({ text: "🌟 Nova Coin • عُد غداً لمزيد من المكافآت! 🌟" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
