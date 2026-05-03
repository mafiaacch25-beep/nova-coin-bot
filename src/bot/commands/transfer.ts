import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, transferCoins } from "../db";
import type { Command } from "../index";

export const transferCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-transfer")
    .setDescription("حوّل عملاتك لشخص آخر")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("المستخدم الذي تريد التحويل إليه").setRequired(true)
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("الكمية").setRequired(true).setMinValue(1)
    )
    .addStringOption((opt) =>
      opt.setName("type").setDescription("نوع العملة").setRequired(true)
        .addChoices(
          { name: "🥇 ذهبية", value: "gold" },
          { name: "🥈 فضية", value: "silver" },
          { name: "🥉 برونزية", value: "bronze" },
        )
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const coinType = interaction.options.getString("type", true) as "gold" | "silver" | "bronze";

    if (target.id === interaction.user.id) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("#FF4444")
          .setTitle("❌ خطأ")
          .setDescription("لا تستطيع التحويل لنفسك!")],
      });
      return;
    }

    await getOrCreateUser(interaction.user.id, interaction.user.username);

    const result = await transferCoins(
      interaction.user.id,
      target.id,
      target.username,
      coinType,
      amount,
      `تحويل من ${interaction.user.username}`
    );

    if (!result.success) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("#FF4444")
          .setTitle("❌ فشل التحويل")
          .setDescription(result.error || "خطأ غير متوقع")],
      });
      return;
    }

    const coinEmoji = coinType === "gold" ? "🥇" : coinType === "silver" ? "🥈" : "🥉";

    await interaction.editReply({
      embeds: [new EmbedBuilder().setColor("#00FF7F")
        .setTitle("✅ تم التحويل بنجاح!")
        .setDescription(`حوّلت **${amount}${coinEmoji}** لـ <@${target.id}>`)
        .setTimestamp()],
    });
  },
};
