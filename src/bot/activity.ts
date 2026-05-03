import { type Client, type Message, type MessageReaction, type User, EmbedBuilder } from "discord.js";
import { addActivityPoints, claimDaily, hasClaimed } from "./db";
import { logger } from "../lib/logger";

const MESSAGE_POINTS = 5;
const REACTION_POINTS = 3;
const MESSAGE_COOLDOWN_MS = 60_000;

const lastMessageTime = new Map<string, number>();

const QUOTES = [
  "كن كالنجوم — حتى في أحلك الليالي تُضيء.",
  "لا تتوقف عن السعي، فالنجاح ليس بعيداً.",
  "كل يوم جديد هو فرصة جديدة لتكون أفضل.",
  "الثبات مفتاح النجاح، والمثابرة طريق التميز.",
  "ابدأ يومك بنية صادقة وستنتهي به بإنجاز حقيقي.",
  "العظمة لا تُبنى في يوم، لكنها تبدأ بخطوة.",
  "القوة ليست في عدم السقوط، بل في النهوض في كل مرة.",
  "احلم بكبر، وابدأ بصغر، وتحرك الآن.",
  "النجاح يحب الصبر، والصبر يحب الإصرار.",
  "أنت أقوى مما تظن، وأقرب للنجاح مما تتخيل.",
  "الفرص لا تنتظر، فكن أنت من يصنعها.",
  "تذكر أن كل بطل كان يوماً مبتدئاً.",
];

function isAfterOneAM(): boolean {
  const riyadh = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Riyadh" }));
  return riyadh.getHours() >= 1;
}

export function registerActivityListeners(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    if (message.author.bot) return;
    if (!message.guild) return;

    const userId = message.author.id;
    const username = message.author.username;
    const now = Date.now();
    const last = lastMessageTime.get(userId) ?? 0;

    if (isAfterOneAM()) {
      try {
        const alreadyClaimed = await hasClaimed(userId);
        if (!alreadyClaimed) {
          const result = await claimDaily(userId, username);
          if (result.success) {
            const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            const embed = new EmbedBuilder()
              .setTitle("🌅 تسجيل دخول يومي!")
              .setColor("#00FF7F")
              .setDescription(`**"${quote}"**`)
              .addFields(
                { name: "🥈 المكافأة", value: "**1 فضية** أُضيفت لرصيدك!", inline: true },
                { name: "👤", value: `<@${userId}>`, inline: true },
              )
              .setFooter({ text: "Nova Coin • يتجدد يومياً بعد الساعة 1 صباحاً | أو استخدم /daily-reward" })
              .setTimestamp();
            try {
              await message.channel.send({ embeds: [embed] });
            } catch { }
          }
        }
      } catch (err) {
        logger.error({ err }, "Error processing auto daily reward");
      }
    }

    if (now - last < MESSAGE_COOLDOWN_MS) return;
    lastMessageTime.set(userId, now);

    try {
      const result = await addActivityPoints(userId, username, MESSAGE_POINTS, "message");
      if (result.milestoneReached) {
        await notifyMilestone(message, result.newMilestone, result.totalPoints);
      }
    } catch (err) {
      logger.error({ err }, "Error tracking message activity");
    }
  });

  client.on("messageReactionAdd", async (reaction: MessageReaction, user: User) => {
    if (user.bot) return;
    if (!reaction.message.guild) return;

    try {
      const result = await addActivityPoints(user.id, user.username, REACTION_POINTS, "reaction");
      if (result.milestoneReached) {
        const channel = reaction.message.channel;
        if (channel.isSendable()) {
          const embed = buildMilestoneEmbed(user.id, result.newMilestone, result.totalPoints);
          await channel.send({ embeds: [embed] });
        }
      }
    } catch (err) {
      logger.error({ err }, "Error tracking reaction activity");
    }
  });
}

async function notifyMilestone(message: Message, milestone: number, totalPoints: number) {
  const embed = buildMilestoneEmbed(message.author.id, milestone, totalPoints);
  try {
    await message.channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error({ err }, "Failed to send milestone notification");
  }
}

function buildMilestoneEmbed(userId: string, milestone: number, totalPoints: number) {
  return new EmbedBuilder()
    .setTitle("🎉 مكافأة النشاط!")
    .setColor("#FFD700")
    .setDescription(
      `<@${userId}> وصل لـ **${totalPoints.toLocaleString()} نقطة نشاط!**\n` +
      `تم إضافة **5 🥈 فضيات** تلقائياً لرصيده!`
    )
    .addFields(
      { name: "🏆 المرحلة", value: `المرحلة ${milestone} (${milestone * 1000} نقطة)`, inline: true },
      { name: "🥈 المكافأة", value: "5 فضيات", inline: true },
    )
    .setFooter({ text: "Nova Coin • كل 1000 نقطة نشاط = 5 فضيات تلقائية" })
    .setTimestamp();
}
