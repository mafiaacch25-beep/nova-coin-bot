import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getConfig, purchaseCustomize } from "../db";
import type { Command } from "../index";
import { logger } from "../../lib/logger";

export const setNameCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-set-name")
    .setDescription("عيّن اسماً مخصصاً — 🥈 25 فضية")
    .addStringOption((opt) =>
      opt.setName("name").setDescription("الاسم الذي تريده").setRequired(true).setMaxLength(32)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const name = interaction.options.getString("name", true).trim();

    if (name.length < 2) {
      await interaction.editReply("الاسم قصير جداً!");
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
      25,
      "name",
      name
    );

    if (!result.success) {
      await interaction.editReply(result.error || "فشل الشراء");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ تم تعيين الاسم!")
      .setColor("#9B59B6")
      .setDescription(`✅ تم خصم **25 🥈 فضية** وتحويلها لحساب الدفع\n✏️ اسمك الجديد: **${name}**`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // إشعار High Admin
    const adminRoleId = await getConfig("admin_role_id");
    if (adminRoleId && interaction.channel?.isSendable()) {
      const notifyEmbed = new EmbedBuilder()
        .setTitle("🛍️ عملية شراء اسم!")
        .setColor("#FFD700")
        .setDescription(`<@${interaction.user.id}> اشترى **اسم مخصص**`)
        .addFields(
          { name: "👤 المشتري", value: `<@${interaction.user.id}>`, inline: true },
          { name: "💰 السعر", value: "25 🥈", inline: true },
          { name: "✏️ الاسم", value: name, inline: true }
        )
        .setTimestamp();
      try {
        await interaction.channel.send({ content: `<@&${adminRoleId}>`, embeds: [notifyEmbed] });
      } catch { }
    }
  },
};
