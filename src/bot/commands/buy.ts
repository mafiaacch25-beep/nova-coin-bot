import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, buyItem, getConfig, getShopItem } from "../db";
import type { Command } from "../index";

export const buyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-buy")
    .setDescription("اشتر عنصراً من المتجر")
    .addIntegerOption((opt) =>
      opt.setName("id").setDescription("رقم العنصر من المتجر").setRequired(true).setMinValue(1)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const itemId = interaction.options.getInteger("id", true);
    await getOrCreateUser(interaction.user.id, interaction.user.username);

    const result = await buyItem(interaction.user.id, itemId);

    if (!result.success) {
      const embed = new EmbedBuilder()
        .setTitle("❌ فشل الشراء")
        .setDescription(result.error || "حدث خطأ غير متوقع")
        .setColor("#FF4444");
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const item = result.item;
    const embed = new EmbedBuilder()
      .setTitle("✅ تم الشراء بنجاح!")
      .setColor("#00FF7F")
      .setDescription(`اشتريت **${item.name}** بنجاح!`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    // إشعار High Admin عند شراء رتبة خاصة بـ 5 ذهبيات
    const shopItem = getShopItem(itemId);
    if (shopItem && shopItem.price === 5 && shopItem.priceType === "gold") {
      const adminRoleId = await getConfig("admin_role_id");
      if (adminRoleId && interaction.channel?.isSendable()) {
        const notifyEmbed = new EmbedBuilder()
          .setTitle("🎖️ شراء رتبة خاصة!")
          .setColor("#FFD700")
          .setDescription(`<@${interaction.user.id}> اشترى **رتبة خاصة**`)
          .addFields(
            { name: "👤 المشتري", value: `<@${interaction.user.id}>`, inline: true },
            { name: "💰 السعر", value: "5 🏆 ذهبية", inline: true },
            { name: "🎖️ الرتبة", value: "رتبة حصرية وخاصة", inline: false }
          )
          .setTimestamp();
        try {
          await interaction.channel.send({ content: `<@&${adminRoleId}>`, embeds: [notifyEmbed] });
        } catch { }
      }
    }
  },
};
