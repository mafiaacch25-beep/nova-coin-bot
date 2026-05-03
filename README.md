# Nova Coin Bot 🪙

Discord bot for a virtual currency system with 3 coin types (gold, silver, bronze), shops, daily rewards, activity tracking, and leaderboards.

## Features 🎯

- **💰 Coin System**: 3 types of coins (Gold 🥇, Silver 🥈, Bronze 🥉)
- **🛒 Shop System**: Customize profile with backgrounds, colors, and custom names
- **🌅 Daily Rewards**: 1 silver coin per day (after 1 AM, Riyadh timezone)
- **📊 Activity Tracking**: Earn points from messages and reactions → 5 silver per 1000 points
- **🏆 Leaderboard**: Auto-updating leaderboard every 5 minutes
- **💸 Exchange System**: Convert between coin types (10 silver = 1 gold, etc.)
- **🎁 Role Requests**: Request custom roles for 5 gold coins
- **👥 Transfers**: Send coins to other users
- **📋 Full Account Stats**: View complete profile with XP, earnings, and achievements

## Setup 🚀

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Discord Bot Token

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nova-coin-bot.git
   cd nova-coin-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values:
   # - DISCORD_BOT_TOKEN: Your Discord bot token
   # - DATABASE_URL: PostgreSQL connection string
   # - PORT: Server port (default: 8080)
   ```

4. **Create Discord Bot**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications)
   - Create a new application
   - Create a bot user
   - Enable these intents:
     - Guilds
     - Guild Messages
     - Guild Message Reactions
   - Copy the token to `DISCORD_BOT_TOKEN` in `.env`
   - Invite bot with these scopes: `bot`, `applications.commands`

5. **Setup Configuration**
   - Run `/nova-config payment-account @user` — set who receives shop payments
   - Run `/nova-config admin-role @role` — set High Admin role
   - Run `/nova-config leaderboard-channel #channel` — auto-update leaderboard

6. **Run the bot**
   ```bash
   npm run dev
   ```

## Available Commands 📝

### User Commands
- `/nova-coin` — Bot info and command list
- `/nova-balance` — View your coin balance
- `/nova-profile [@user]` — View profile (yours or another user)
- `/nova-me [@user]` — Complete account stats
- `/nova-leaderboard` — Top 10 richest players
- `/nova-activity me [@user]` — View activity points
- `/nova-activity top` — Top 10 most active users
- `/daily-reward` — Claim daily silver reward (once per day after 1 AM)

### Shop Commands (Payments in silver coins)
- `/nova-set-bg <url>` — Set custom background (30 🥈)
- `/nova-set-color <hex>` — Set custom name color (20 🥈)
- `/nova-set-name <name>` — Set custom name (25 🥈)
- `/nova-shop` — View shop and prices
- `/nova-buy <id>` — Buy from shop

### Economy Commands
- `/nova-transfer @user <amount> <type>` — Send coins to another user
- `/nova-exchange <from> <amount>` — Convert coins
- `/nova-role-request <role_name>` — Request custom role (5 🥇)

### Admin Commands (High Admin role only)
- `/nova-add @user <amount> <type> <reason>` — Add coins to user
- `/nova-remove @user <amount> <type> <reason>` — Remove coins from user
- `/nova-config payment-account @user` — Set payment recipient account
- `/nova-config admin-role @role` — Set High Admin role
- `/nova-config leaderboard-channel #channel` — Set leaderboard channel
- `/nova-config info` — View current config

## Coin Exchange Rates 💱

| Exchange | Rate |
|----------|------|
| Silver → Gold | 10 silver = 1 gold |
| Gold → Silver | 1 gold = 10 silver |
| Bronze → Silver | 10 bronze = 1 silver |
| Silver → Bronze | 1 silver = 10 bronze |

## Rank System 🏅

| Rank | Value Range |
|------|-------------|
| 🆕 Beginner | 0–99 |
| 🔰 Normal | 100–499 |
| ⚡ Advanced | 500–999 |
| 🌟 Star | 1000–4999 |
| 👑 Royal | 5000–9999 |
| 💎 Legendary | 10000+ |

## Deployment on Railway 🚂

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/nova-coin-bot.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [Railway.app](https://railway.app)
   - Create new project → Deploy from GitHub
   - Select this repository
   - Add PostgreSQL plugin
   - Configure environment variables:
     - `DISCORD_BOT_TOKEN`
     - `DATABASE_URL` (Railway auto-generates from PostgreSQL)
     - `PORT` (Railway sets this automatically)
     - `NODE_ENV=production`
   - Deploy!
   - After deployment, use `/nova-config` commands to setup payment account and admin role

## Database Schema 🗄️

The bot automatically creates these tables:

### nova_users
- User accounts with coin balances and customizations

### nova_transactions
- Transaction history for all coin movements

### nova_daily_checkin
- Daily reward tracking (one per user per day)

### nova_activity
- Activity points and XP tracking

### nova_bot_config
- Bot configuration (Selloraa account, admin role, leaderboard channel)

## Development 💻

### Run in development mode
```bash
npm run dev
```

### Type check
```bash
npm run typecheck
```

### Build production bundle
```bash
npm run build
```

## License 📄

MIT

## Support 💬

For issues or questions, open an issue on GitHub!

---

**Made with ❤️ for Discord communities**
