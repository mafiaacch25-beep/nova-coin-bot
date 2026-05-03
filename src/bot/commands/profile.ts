import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser } from "../db";
import type { Command } from "../index";

const backgroundColors: Record<string, `#${string}`> = {
  sunset: "#FF6B35",
  galaxy: "#1a0533",
  forest: "#228B22",
  ocean: "#006994",
  fire: "#FF4500",
};

export const profileCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-profile")
    .setDescription("اعرض بروفايلك أو بروفايل شخص آخر")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("المستخدم (اختياري)").setRequired(false)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const target = interaction.options.getUser("user") || interaction.user;
    const user = await getOrCreateUser(target.id, target.username);

    const totalValue = user.gold * 100 + user.silver * 10 + user.bronze;
    const bgColor = user.background ? backgroundColors[user.background] || "#2b2d31" : "#2b2d31";

    let rank = "🆕 مبتدئ";
    if (totalValue >= 10000) rank = "💎 أسطوري";
    else if (totalValue >= 5000) rank = "👑 ملكي";
    else if (totalValue >= 1000) rank = "🌟 نجم";
    else if (totalValue >= 500) rank = "⚡ متقدم";
    else if (totalValue >= 100) rank = "🔰 عادي";

    const embed = new EmbedBuilder()
      .setTitle(`${user.custom_name || target.displayName}'s Profile`)
      .setColor(user.custom_color as `#${string}` || bgColor)
      .setThumbnail(target.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "🎖️ الرتبة", value: rank, inline: true },
        { name: "💫 القيمة الإجمالية", value: `**${totalValue}** نقطة`, inline: true },
        { name: "\u200b", value: "\u200b", inline: true },
        { name: "🥇 ذهبية", value: `**${user.gold}**`, inline: true },
        { name: "🥈 فضية", value: `**${user.silver}**`, inline: true },
        { name: "🥉 برونزية", value: `**${user.bronze}**`, inline: true },
      );

    if (user.background) {
      embed.addFields({ name: "🖼️ الخلفية", value: user.background, inline: true });
    }

    embed.setFooter({ text: `Nova Coin System • انضم منذ ${new Date(user.created_at).toLocaleDateString("ar-SA")}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
