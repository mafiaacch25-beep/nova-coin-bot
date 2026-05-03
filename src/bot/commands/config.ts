import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from "discord.js";
import { setConfig, getConfig } from "../db";
import type { Command } from "../index";

export const configCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("nova-config")
    .setDescription("إعدادات البوت (للمشرفين فقط)")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub.setName("payment-account")
        .setDescription("عيّن حساب الدفع الذي تُحوَّل إليه عملات التخصيصات")
        .addUserOption((opt) =>
          opt.setName("user").setDescription("حساب الدفع").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("admin-role")
        .setDescription("عيّن رول الـ High Admin الذي يُنشن عند طلب الرتب")
        .addRoleOption((opt) =>
          opt.setName("role").setDescription("رول High Admin").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("leaderboard-channel")
        .setDescription("عيّن القناة التي يُنشر فيها ترتيب اللاعبين تلقائياً")
        .addChannelOption((opt) =>
          opt.setName("channel").setDescription("القناة المخصصة للترتيب").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("github-token")
        .setDescription("عيّن توكن GitHub للوصول إلى API")
        .addStringOption((opt) =>
          opt.setName("token").setDescription("GitHub Token").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub.setName("info")
        .setDescription("اعرض الإعدادات الحالية")
    ) as any,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });
    const sub = interaction.options.getSubcommand();

    if (sub === "payment-account") {
      const user = interaction.options.getUser("user", true);
      await setConfig("selloraa_id", user.id);
      await setConfig("selloraa_name", user.username);

      const embed = new EmbedBuilder()
        .setTitle("✅ تم تعيين حساب الدفع")
        .setColor("#00FF7F")
        .setDescription(`سيتم تحويل جميع عملات التخصيصات لـ <@${user.id}>`)
        .setFooter({ text: "Nova Coin System" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === "admin-role") {
      const role = interaction.options.getRole("role", true);
      await setConfig("admin_role_id", role.id);
      await setConfig("admin_role_name", role.name);

      const embed = new EmbedBuilder()
        .setTitle("✅ تم تعيين High Admin Role")
        .setColor("#00FF7F")
        .setDescription(`الآن يمكن لأعضاء رتبة <@&${role.id}> استخدام أوامر الإدارة`)
        .setFooter({ text: "Nova Coin System" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === "leaderboard-channel") {
      const channel = interaction.options.getChannel("channel", true);
      await setConfig("leaderboard_channel_id", channel.id);

      const embed = new EmbedBuilder()
        .setTitle("✅ تم تعيين قناة الترتيب")
        .setColor("#00FF7F")
        .setDescription(`سيتم نشر ترتيب اللاعبين تلقائياً في <#${channel.id}> كل 5 دقائق`)
        .setFooter({ text: "Nova Coin System" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === "github-token") {
      const token = interaction.options.getString("token", true);
      await setConfig("github_token", token);

      const embed = new EmbedBuilder()
        .setTitle("✅ تم تعيين GitHub Token")
        .setColor("#00FF7F")
        .setDescription("تم حفظ توكن GitHub بنجاح! 🔐")
        .setFooter({ text: "Nova Coin System" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } else if (sub === "info") {
      const selloraaId = await getConfig("selloraa_id");
      const adminRoleId = await getConfig("admin_role_id");
      const leaderboardChannelId = await getConfig("leaderboard_channel_id");
      const githubToken = await getConfig("github_token");

      const embed = new EmbedBuilder()
        .setTitle("⚙️ إعدادات البوت الحالية")
        .setColor("#3498DB")
        .addFields(
          { name: "💸 حساب الدفع", value: selloraaId ? `<@${selloraaId}>` : "لم يتم تعيينه", inline: false },
          { name: "🛡️ High Admin Role", value: adminRoleId ? `<@&${adminRoleId}>` : "لم يتم تعيينه", inline: false },
          { name: "📊 قناة الترتيب", value: leaderboardChannelId ? `<#${leaderboardChannelId}>` : "لم يتم تعيينها", inline: false },
          { name: "🔐 GitHub Token", value: githubToken ? "✅ تم تعيينه" : "❌ لم يتم تعيينه", inline: false },
        )
        .setFooter({ text: "Nova Coin System" })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
