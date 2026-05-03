import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getConfig } from "../db";
import type { Command } from "../index";

export const shopCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-shop")
    .setDescription("عرض متجر التخصيصات وأسعارها"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const paymentAccountId = await getConfig("selloraa_id");
    const paymentAccountTag = paymentAccountId ? `<@${paymentAccountId}>` : "حساب الدفع";

    const embed = new EmbedBuilder()
      .setTitle("🛒 متجر التخصيصات — Nova Coin")
      .setColor("#9B59B6")
      .setDescription(
        `💸 **جميع المشتريات تُحوّل لـ ${paymentAccountTag}**\n\u200b`
      )
      .addFields(
        {
          name: "🖼️ خلفية مخصصة — 🥈 30 فضية",
          value:
            "أرسل رابط الصورة التي تريدها خلفية في بروفايلك.\n" +
            "```\n/nova-set-bg url: https://example.com/image.png\n```",
        },
        {
          name: "🎨 لون مخصص — 🥈 20 فضية",
          value:
            "أرسل كود اللون بصيغة HEX (مثال: #FF5733).\n" +
            "```\n/nova-set-color hex: #FF5733\n```",
        },
        {
          name: "✏️ اسم مخصص — 🥈 25 فضية",
          value:
            "أرسل الاسم الذي تريده يظهر في بروفايلك.\n" +
            "```\n/nova-set-name name: اسمك هنا\n```",
        },
      )
      .setFooter({ text: "Nova Coin System • العملات تُحوّل تلقائياً عند الشراء" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
