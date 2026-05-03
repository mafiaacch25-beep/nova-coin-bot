import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser, pool } from "../db";
import type { Command } from "../index";

const RATES: Record<string, { to: string; rate: number }> = {
  "silver_to_gold":   { to: "gold",   rate: 10 },
  "gold_to_silver":   { to: "silver", rate: 10 },
  "bronze_to_silver": { to: "silver", rate: 10 },
  "silver_to_bronze": { to: "bronze", rate: 10 },
};

export const exchangeCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-exchange")
    .setDescription("حوّل عملاتك بين الأنواع المختلفة")
    .addStringOption((opt) =>
      opt.setName("from").setDescription("من أي عملة؟").setRequired(true)
        .addChoices(
          { name: "🥈 فضية ← 🥇 ذهبية  (10 فضية = 1 ذهبية)", value: "silver_to_gold" },
          { name: "🥇 ذهبية ← 🥈 فضية  (1 ذهبية = 10 فضية)", value: "gold_to_silver" },
          { name: "🥉 برونزية ← 🥈 فضية  (10 برونزية = 1 فضية)", value: "bronze_to_silver" },
          { name: "🥈 فضية ← 🥉 برونزية  (1 فضية = 10 برونزية)", value: "silver_to_bronze" },
        )
    )
    .addIntegerOption((opt) =>
      opt.setName("amount").setDescription("كمية العملة التي تريد تحويلها").setRequired(true).setMinValue(1)
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    const choice = interaction.options.getString("from", true);
    const amount = interaction.options.getInteger("amount", true);
    const rule = RATES[choice];

    if (!rule) {
      await interaction.editReply({ content: "خيار غير صحيح." });
      return;
    }

    const fromCoin = choice.split("_to_")[0] as "gold" | "silver" | "bronze";
    const toCoin = rule.to as "gold" | "silver" | "bronze";

    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    if (user[fromCoin] < amount) {
      const embed = new EmbedBuilder()
        .setTitle("❌ رصيد غير كافٍ")
        .setColor("#FF4444")
        .setDescription(`لديك فقط **${user[fromCoin]}** من هذه العملة`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const resultAmount = Math.floor(amount / rule.rate);

    await pool.query(
      `UPDATE nova_users SET ${fromCoin} = ${fromCoin} - $1, ${toCoin} = ${toCoin} + $2 WHERE discord_id = $3`,
      [amount, resultAmount, interaction.user.id]
    );

    const embed = new EmbedBuilder()
      .setTitle("✅ تم التحويل!")
      .setColor("#00FF7F")
      .setDescription(`حوّلت **${amount}** عملة إلى **${resultAmount}** عملة`)
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
