import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getConfig, purchaseCustomize } from "../db";
import type { Command } from "../index";
import { logger } from "../../lib/logger";

export const setBackgroundCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-set-bg")
    .setDescription("عيّن خلفية مخصصة لبروفايلك — 🥈 30 فضية")
    .addStringOption((opt) =>
      opt.setName("url").setDescription("رابط الصورة").setRequired(true)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.options.getString("url", true).trim();

    if (!url.startsWith("http")) {
      await interaction.editReply("يجب أن يبدأ الرابط بـ https://");
      return;
    }

    const paymentId = await getConfig("selloraa_id");
    if (!paymentId) {
      await interaction.editReply("لم يتم تعيين حساب الدفع!");
      return;
    }

    await getOrCreateUser(interaction.user.id, interaction.user.username);

    const result = await purchaseCustomize(
      interaction.user.id,
      interaction.user.username,
      paymentId,
      "PaymentAccount",
      "silver",
      30,
      "background",
      url
    );

    if (!result.success) {
      await interaction.editReply(result.error || "فشل الشراء");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ تم تعيين الخلفية!")
      .setColor("#00FF7F")
      .setDescription(`✅ تم خصم **30 🥈 فضية** وتحويلها لحساب الدفع\n🖼️ تم تعيين خلفيتك الجديدة`)
      .setImage(url)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // إشعار High Admin
    const adminRoleId = await getConfig("admin_role_id");
    if (adminRoleId && interaction.channel?.isSendable()) {
      const notifyEmbed = new EmbedBuilder()
        .setTitle("🛍️ عملية شراء خلفية!")
        .setColor("#FFD700")
        .setDescription(`<@${interaction.user.id}> اشترى **خلفية مخصصة**`)
        .addFields(
          { name: "👤 المشتري", value: `<@${interaction.user.id}>`, inline: true },
          { name: "💰 السعر", value: "30 🥈", inline: true },
          { name: "🖼️ الخلفية", value: url, inline: false }
        )
        .setImage(url)
        .setTimestamp();
      try {
        await interaction.channel.send({ content: `<@&${adminRoleId}>`, embeds: [notifyEmbed] });
      } catch { }
    }
  },
};
