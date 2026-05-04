import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  REST,
  Routes,
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
} from 'discord.js';
import { logger } from '../lib/logger';
import { balanceCommand } from './commands/balance';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { profileCommand } from './commands/profile';
import { leaderboardCommand } from './commands/leaderboard';
import { shopCommand } from './commands/shop';
import { transferCommand } from './commands/transfer';
import { setBackgroundCommand } from './commands/setBackground';
import { setColorCommand } from './commands/setColor';
import { setNameCommand } from './commands/setName';
import { setGithubCommand } from './commands/setGithub';
import { configCommand } from './commands/config';
import { exchangeCommand } from './commands/exchange';
import { activityCommand } from './commands/activity';
import { roleRequestCommand } from './commands/roleRequest';
import { dailyRewardCommand } from './commands/dailyReward';
import { meCommand } from './commands/me';
import { novaCoinCommand } from './commands/novaCoin';
import { registerActivityListeners } from './activity';
import { startAutoLeaderboard } from './autoLeaderboard';
import { startGitHubSync } from './githubSync';

export interface Command {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
}

const commands: Command[] = [
  novaCoinCommand,
  balanceCommand,
  profileCommand,
  leaderboardCommand,
  shopCommand,
  transferCommand,
  exchangeCommand,
  activityCommand,
  roleRequestCommand,
  dailyRewardCommand,
  meCommand,
  setBackgroundCommand,
  setColorCommand,
  setNameCommand,
  setGithubCommand,
  addCommand,
  removeCommand,
  configCommand,
];

export async function startBot() {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    logger.warn('DISCORD_BOT_TOKEN not set, skipping bot startup');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User],
  });

  const commandCollection = new Collection<string, Command>();
  for (const cmd of commands) {
    commandCollection.set(cmd.data.name, cmd);
  }

  client.once('clientReady', async (c) => {
    logger.info({ tag: c.user.tag }, 'Bot is ready');

    const rest = new REST().setToken(token);
    const commandsJSON = commands.map((c) => c.data.toJSON());

    try {
      await rest.put(Routes.applicationCommands(c.user.id), {
        body: commandsJSON,
      });
      logger.info('Slash commands registered globally');
    } catch (err) {
      logger.error({ err }, 'Failed to register slash commands');
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandCollection.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error({ err, command: interaction.commandName }, 'Command error');
      const msg = { content: 'حدث خطأ أثناء تنفيذ الأمر.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  });

  registerActivityListeners(client);
  startAutoLeaderboard(client);
  startGitHubSync();

  await client.login(token);
}
