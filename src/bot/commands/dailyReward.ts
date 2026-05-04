import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getOrCreateUser, claimDaily, hasClaimed, getDailyDate, getDailyCount } from '../db';
import type { Command } from '../index';

const AUTO_DELETE_MS = 5_000;

const QUOTES = [
  'كن كالنجوم — حتى في أحلك الليالي تُضيء.',
  'لا تتوقف عن السعي، فالنجاح ليس بعيداً.',
  'كل يوم جديد هو فرصة جديدة لتكون أفضل.',
  'الثبات مفتاح النجاح، والمثابرة طريق التميز.',
  'احلم بكبر، وابدأ بصغر، وتحرك الآن.',
  'النجاح يحب الصبر، والصبر يحب الإصرار.',
  'أنت أقوى مما تظن، وأقرب للنجاح مما تتخيل.',
];

const FLOWER_COLORS = [
  { emoji: '🌹', color: '#FF1493' },
  { emoji: '🌺', color: '#FF69B4' },
  { emoji: '🌸', color: '#FFB6C1' },
  { emoji: '🌼', color: '#FFD700' },
  { emoji: '🌻', color: '#FFA500' },
  { emoji: '🌷', color: '#FF6347' },
  { emoji: '💐', color: '#FF1493' },
];

export const dailyRewardCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('daily-reward')
    .setDescription('سجّل دخولك اليومي واحصل على 🥈 1 فضية (مرة واحدة يومياً بعد الساعة 1 صباحاً)'),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    await getOrCreateUser(interaction.user.id, interaction.user.username);

    const nowRiyadh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Riyadh' }));
    if (nowRiyadh.getHours() < 1) {
      const embed = new EmbedBuilder()
        .setTitle('⏰ ⏰ ⏰ ليس الوقت بعد! ⏰ ⏰ ⏰')
        .setColor('#FF8C00')
        .setDescription(
          '━━━━━━━━━━━━━━━━━━━━━━
' +
          '⏳ يمكنك تسجيل الدخول **بعد الساعة 1:00 صباحاً** فقط

' +
          `🕐 الوقت الحالي: **${nowRiyadh.getHours()}:${String(nowRiyadh.getMinutes()).padStart(2, '0')}** بتوقيت الرياض
` +
          '━━━━━━━━━━━━━━━━━━━━━━'
        )
        .setThumbnail(interaction.user.displayAvatarURL());
      const reply = await interaction.editReply({ embeds: [embed] });
      setTimeout(() => { reply.delete().catch(() => {}); }, AUTO_DELETE_MS);
      return;
    }

    const result = await claimDaily(interaction.user.id, interaction.user.username);

    if (!result.success && result.alreadyClaimed) {
      const embed = new EmbedBuilder()
        .setTitle('✋ ✋ ✋ سجّلت مسبقاً اليوم! ✋ ✋ ✋')
        .setColor('#FF8C00')
        .setDescription(
          '━━━━━━━━━━━━━━━━━━━━━━
' +
          '😅 لقد سجّلت دخولك اليوم بالفعل
' +
          '🥈 وأخذت فضيتك!

' +
          '⏰ عُد غداً بعد الساعة 1:00 صباحاً! 🌙
' +
          '━━━━━━━━━━━━━━━━━━━━━━'
        )
        .setThumbnail(interaction.user.displayAvatarURL());
      const reply = await interaction.editReply({ embeds: [embed] });
      setTimeout(() => { reply.delete().catch(() => {}); }, AUTO_DELETE_MS);
      return;
    }

    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const randomFlower = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
    const totalToday = await getDailyCount();

    const embed = new EmbedBuilder()
      .setTitle(`${randomFlower.emoji}  تسجيل دخول ناجح! 🎉  ${randomFlower.emoji}`)
      .setColor(randomFlower.color)
      .setDescription(
        `✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨

` +
        `💬 **${randomQuote}**

` +
        `✨ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ✨`
      )
      .setThumbnail(interaction.user.displayAvatarURL())
      .addFields(
        {
          name: `${randomFlower.emoji} المكافأة الرائعة ${randomFlower.emoji}`,
          value: `🥈 **1 فضية** أُضيفت لرصيدك!
⭐ احتفل بتسجيلك اليومي!`,
          inline: false,
        },
        {
          name: `👥 الإحصائيات اليومية`,
          value: `✅ **${totalToday}** لاعب سجّلوا دخولهم اليوم`,
          inline: false,
        },
        {
          name: `📅 معلومات إضافية`,
          value: `🗓️ تاريخ اليوم: ${getDailyDate()}
⏰ الوقت: ${nowRiyadh.getHours()}:${String(nowRiyadh.getMinutes()).padStart(2, '0')}`,
          inline: false,
        }
      )
      .setFooter({ text: '🌟 Nova Coin • عُد غداً لمزيد من المكافآت! 🌟' })
      .setTimestamp();

    const reply = await interaction.editReply({ embeds: [embed] });
    setTimeout(() => { reply.delete().catch(() => {}); }, AUTO_DELETE_MS);
  },
};
