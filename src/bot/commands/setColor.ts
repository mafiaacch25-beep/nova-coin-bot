import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getConfig, purchaseCustomize } from "../db";
import type { Command } from "../index";
import { logger } from "../../lib/logger";

export const setColorCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-set-color")
    .setDescription("عيّن لون مخصص — 🥈 20 فضية")
    .addStringOption((opt) =>
      opt.setName("hex").setDescription("كود HEX مثال: #FF5733").setRequired(true)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    let hex = interaction.options.getString("hex", true).trim();
    if (!hex.startsWith("#")) hex = "#" + hex;

    if (!/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex)) {
      await interaction.editReply("كود لون HEX غير صحيح!");
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
      20,
      "color",
      hex
    );

    if (!result.success) {
      await interaction.editReply(result.error || "فشل الشراء");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("✅ تم تعيين اللون!")
      .setColor(hex as `#${string}`)
      .setDescription(`✅ تم خصم **20 🥈 فضية** وتحويلها لحساب الدفع\n🎨 لونك الجديد: ${hex}`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // إشعار High Admin
    const adminRoleId = await getConfig("admin_role_id");
    if (adminRoleId && interaction.channel?.isSendable()) {
      const notifyEmbed = new EmbedBuilder()
        .setTitle("🛍️ عملية شراء لون!")
        .setColor("#FFD700")
        .setDescription(`<@${interaction.user.id}> اشترى **لون مخصص**`)
        .addFields(
          { name: "👤 المشتري", value: `<@${interaction.user.id}>`, inline: true },
          { name: "💰 السعر", value: "20 🥈", inline: true },
          { name: "🎨 اللون", value: hex, inline: true }
        )
        .setTimestamp();
      try {
        await interaction.channel.send({ content: `<@&${adminRoleId}>`, embeds: [notifyEmbed] });
      } catch { }
    }
  },
};
