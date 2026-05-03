import { SlashCommandBuilder, EmbedBuilder, type ChatInputCommandInteraction } from "discord.js";
import { getOrCreateUser } from "../db";
import type { Command } from "../index";

export const novaCoinCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-coin")
    .setDescription("معلومات عن نظام Nova Coin وجميع الأوامر"),

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);

    const embed = new EmbedBuilder()
      .setTitle("🪙 Nova Coin — نظام العملات")
      .setColor("#FFD700")
      .setDescription(
        "مرحباً بك في **Nova Coin**!\n" +
        "اكسب العملات، خصّص بروفايلك، وتصدر قائمة الأثرياء!"
      )
      .addFields(
        {
          name: "🪙 أنواع العملات",
          value:
            "🥇 **ذهبية** — أعلى قيمة (×100 نقطة)\n" +
            "🥈 **فضية** — قيمة متوسطة (×10 نقاط)\n" +
            "🥉 **برونزية** — أقل قيمة (×1 نقطة)",
        },
        {
          name: "📋 أوامر العرض",
          value:
            "`/nova-balance` — رصيدك\n" +
            "`/nova-profile` — بروفايلك\n" +
            "`/nova-leaderboard` — أغنى لاعبين\n" +
            "`/nova-me` — حسابك الكامل",
        },
        {
          name: "🛒 أوامر التخصيص",
          value:
            "`/nova-set-bg` — خلفية 30 🥈\n" +
            "`/nova-set-color` — لون 20 🥈\n" +
            "`/nova-set-name` — اسم 25 🥈\n" +
            "`/nova-shop` — عرض المتجر",
        },
        {
          name: "💱 تحويل العملات",
          value: "`/nova-exchange` — حوّل بين العملات\n`/nova-transfer` — ارسل لشخص آخر",
        },
        {
          name: "💰 رصيدك الحالي",
          value: `🥇 ${user.gold} | 🥈 ${user.silver} | 🥉 ${user.bronze}`,
        },
      )
      .setFooter({ text: "Nova Coin System" })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
