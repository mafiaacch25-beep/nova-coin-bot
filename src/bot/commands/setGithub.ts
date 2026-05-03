import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, pool } from "../db";
import type { Command } from "../index";

export const setGithubCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-set-github")
    .setDescription("عيّن توكن GitHub الخاص بك")
    .addStringOption((opt) =>
      opt.setName("token").setDescription("GitHub Token الخاص بك").setRequired(true)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const token = interaction.options.getString("token", true);
    await getOrCreateUser(interaction.user.id, interaction.user.username);

    try {
      await pool.query(
        "UPDATE nova_users SET github_token = $1 WHERE discord_id = $2",
        [token, interaction.user.id]
      );

      const embed = new EmbedBuilder()
        .setTitle("✅ تم تعيين GitHub Token!")
        .setColor("#00FF7F")
        .setDescription("تم حفظ توكن GitHub الخاص بك بنجاح! 🔐\n\nيمكنك الآن استخدام هذا التوكن في التطبيقات المتصلة.")
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: "Nova Coin System • لا تشارك توكنك مع أحد!" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setTitle("❌ فشل تعيين التوكن")
        .setColor("#FF4444")
        .setDescription("حدث خطأ أثناء حفظ التوكن. حاول مرة أخرى لاحقاً.")
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
