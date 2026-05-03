import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, getTransactions } from "../db";
import type { Command } from "../index";

export const balanceCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-balance")
    .setDescription("اعرض رصيدك من العملات"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const transactions = await getTransactions(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle(`💰 رصيد ${user.custom_name || interaction.user.displayName}`)
      .setColor((user.custom_color as `#${string}`) || "#FFD700")
      .addFields(
        { name: "🥇 ذهبية", value: `**${user.gold}**`, inline: true },
        { name: "🥈 فضية", value: `**${user.silver}**`, inline: true },
        { name: "🥉 برونزية", value: `**${user.bronze}**`, inline: true },
      )
      .setThumbnail(interaction.user.displayAvatarURL());

    if (transactions.length > 0) {
      const txList = transactions.slice(0, 5).map((tx: any) => {
        const icon = tx.type === "add" ? "➕" : "➖";
        const coin = tx.coin_type === "gold" ? "🥇" : tx.coin_type === "silver" ? "🥈" : "🥉";
        const date = new Date(tx.created_at).toLocaleDateString("ar-SA");
        return `${icon} ${tx.amount} ${coin} | ${tx.reason} | ${date}`;
      }).join("\n");
      embed.addFields({ name: "📋 آخر المعاملات", value: txList });
    }

    embed.setFooter({ text: "Nova Coin System" }).setTimestamp();
    await interaction.editReply({ embeds: [embed] });
  },
};
