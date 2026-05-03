import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getUser, pool, getConfig } from "../db";
import type { Command } from "../index";

export const roleRequestCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-role-request")
    .setDescription("اطلب رتبة خاصة — 🥇 5 ذهبية")
    .addStringOption((opt) =>
      opt.setName("role_name").setDescription("اسم الرتبة التي تريدها").setRequired(true).setMaxLength(50)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const roleName = interaction.options.getString("role_name", true).trim();
    await getOrCreateUser(interaction.user.id, interaction.user.username);
    const user = await getUser(interaction.user.id);

    if (!user || user.gold < 5) {
      const embed = new EmbedBuilder()
        .setTitle("❌ رصيد غير كافٍ")
        .setColor("#FF4444")
        .setDescription(`تحتاج **5 🥇 ذهبية**\nلديك: **${user?.gold ?? 0}**`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await pool.query(
      "UPDATE nova_users SET gold = gold - 5 WHERE discord_id = $1",
      [interaction.user.id]
    );

    const adminRoleId = await getConfig("admin_role_id");
    const embed = new EmbedBuilder()
      .setTitle("✅ تم طلب الرتبة!")
      .setColor("#00FF7F")
      .setDescription(`طلبت رتبة **${roleName}** بـ 5 🥇 ذهبية\nسيقوم المشرفون بمراجعة طلبك`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

    if (adminRoleId && interaction.channel?.isSendable()) {
      const notifyEmbed = new EmbedBuilder()
        .setTitle("👑 طلب رتبة جديد!")
        .setColor("#9B59B6")
        .setDescription(`<@${interaction.user.id}> طلب رتبة **${roleName}**`)
        .setTimestamp();
      try {
        await interaction.channel.send({ content: `<@&${adminRoleId}>`, embeds: [notifyEmbed] });
      } catch { }
    }
  },
};
