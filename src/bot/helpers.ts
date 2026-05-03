import { type ChatInputCommandInteraction, PermissionFlagsBits } from "discord.js";
import { getConfig } from "./db";

export async function isHighAdmin(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const member = interaction.member;
  if (!member) return false;

  if (
    typeof member.permissions !== "string" &&
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  ) return true;

  const adminRoleId = await getConfig("admin_role_id");
  if (!adminRoleId) return false;

  const roles = member.roles;
  if (Array.isArray(roles)) return roles.includes(adminRoleId);
  return (roles as any).cache?.has(adminRoleId) ?? false;
}
