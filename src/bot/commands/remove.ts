import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, updateCoins } from "../db";
import { isHighAdmin } from "../helpers";
import type { Command } from "../index";

export const removeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-remove")
    .setDescription("اخصم عملات من مستخدم (High Admin فقط)")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("المستخدم").setRequired(true)
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
    )
    .addStringOption((opt) =>
      opt.setName("reason").setDescription("السبب").setRequired(true)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    if (!(await isHighAdmin(interaction))) {
      await interaction.editReply({
        embeds: [new EmbedBuilder().setColor("#FF4444")
          .setTitle("🚫 ليس لديك صلاحية")
          .setDescription("هذا الأمر مخصص لـ **High Admin** فقط.")],
      });
      return;
    }

    const target = interaction.options.getUser("user", true);
    const amount = interaction.options.getInteger("amount", true);
    const coinType = interaction.options.getString("type", true) as "gold" | "silver" | "bronze";
    const reason = interaction.options.getString("reason", true);

    await getOrCreateUser(target.id, target.username);
    await updateCoins(target.id, coinType, amount, "remove", reason, interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle("🔴 تم خصم العملات")
      .setColor("#FF4444")
      .addFields(
        { name: "المستخدم", value: `<@${target.id}>`, inline: true },
        { name: "السبب", value: reason },
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
