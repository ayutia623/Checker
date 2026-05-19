# 🎯 Multi-Platform Account Checker

A powerful, modern account checker that supports **70+ platforms** including gaming services, streaming platforms, social media, and more. Built with Next.js 14, TypeScript, and TailwindCSS.

## ✨ Features

### Core Features
- 🎮 **70+ Platform Support** - Check accounts across gaming, streaming, social media, and more
- 🚀 **Multi-Threading** - Configurable threads (1-200) for optimal performance
- 🔒 **Proxy Support** - HTTP, HTTPS, SOCKS4, SOCKS5 with authentication
- 📊 **Real-time Statistics** - Live CPM, success rate, and progress tracking
- 💾 **Multiple Export Formats** - Export results as TXT, CSV, or JSON
- 🎨 **Modern UI** - Dark theme with gradient accents and responsive design
- 📈 **Complete Capture System** - Extract account details (rank, level, balance, subscription, etc.)

### Supported Platforms

#### Email Services
- Hotmail/Outlook
- Gmail  
- Yahoo Mail
- ProtonMail

#### Gaming Platforms (30+)
- **PC Gaming**: Steam, Epic Games, Riot Games, EA Origin, Ubisoft, Battle.net, Rockstar, GOG, Bethesda
- **Specific Games**: Roblox, Valorant, League of Legends, Fortnite, CS:GO/CS2, Dota 2, Apex Legends, Overwatch, Rainbow Six Siege, Call of Duty, Warzone, GTA V Online, Minecraft, Rust, ARK, Escape from Tarkov
- **War Games**: World of Tanks, World of Warships, War Thunder, Gaijin.net
- **Console**: PlayStation Network, Xbox Live, Nintendo Account

#### Mobile Gaming (12+)
- PUBG Mobile
- Free Fire
- Mobile Legends
- COD Mobile
- Clash of Clans
- Clash Royale
- Brawl Stars
- Genshin Impact
- Honkai Star Rail
- Tower of Fantasy
- Arena of Valor
- Wild Rift

#### Social Media (12+)
- Instagram
- Twitter / X
- Facebook
- TikTok
- Discord
- Snapchat
- Telegram
- Reddit
- Pinterest
- LinkedIn
- Twitch
- YouTube

#### Streaming Services (9+)
- Netflix
- Spotify
- Disney+
- Hulu
- Amazon Prime Video
- HBO Max
- Crunchyroll
- Apple TV+
- Paramount+

#### Other Services
- PayPal
- Amazon
- eBay
- NordVPN
- ExpressVPN
- Surfshark
- Canva
- Dropbox

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ayutia623/Checker.git
cd Checker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## 📖 Usage Guide

### 1. Select Platform
- Choose a platform category (Email, Gaming, Mobile Gaming, etc.)
- Select the specific platform you want to check

### 2. Upload Combo List
**Format**: `email:password` (one per line)

**Example**:
```
user1@example.com:password123
user2@gmail.com:mypass456
```

You can either:
- Upload a `.txt` file
- Paste directly into the text area

### 3. Configure Settings

#### Thread Settings
- **Threads**: 1-200 (default: 10)
- **Timeout**: 5000-60000ms (default: 30000)

#### Options
- **Enable Proxy**: Use proxy list for checking
- **Proxy Rotation**: Rotate through proxy list
- **Stop on Error**: Stop checking if critical error occurs

### 4. Proxy Setup (Optional)

**Supported Formats**:
```
host:port
http://host:port
https://host:port
socks4://host:port
socks5://host:port
http://user:pass@host:port
```

**Example**:
```
proxy1.example.com:8080
http://proxy2.example.com:3128
socks5://user:pass@proxy3.example.com:1080
```

### 5. Start Checking
- Click "🚀 Start Checking" button
- Monitor real-time progress and statistics
- View results as they complete

### 6. Export Results
- Filter results: All, Valid, Invalid, or Errors
- Export to TXT, CSV, or JSON format
- View detailed capture information for valid accounts

## 📊 Capture System

For valid accounts, the checker extracts detailed information:

### Gaming Accounts
- Username, Display Name
- Level, Rank, Region
- In-game Currency (VP, RP, Robux, etc.)
- Steam/Epic Balance
- Win/Loss Stats, K/D Ratio
- Playtime, Skins Count
- Inventory Items

### Streaming Services
- Profile Name
- Subscription Plan
- Screen Count
- Next Billing Date

### Social Media
- Username, Display Name
- Followers, Following Count
- Posts Count
- Verified Status
- Bio

### General Information
- Email Verified Status
- Phone Number
- 2FA Enabled
- Account Created Date
- Last Login
- Country, Language
- Premium/Subscription Status

## 🛠️ Technical Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Proxy Support**: https-proxy-agent, socks-proxy-agent
- **Build Tool**: Turbopack

## 📁 Project Structure

```
Checker/
├── app/
│   ├── api/
│   │   └── check/
│   │       └── route.ts          # API endpoint for checking
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page
├── components/
│   ├── Dashboard.tsx              # Main dashboard
│   ├── PlatformSelector.tsx       # Platform selection
│   ├── ComboUploader.tsx          # Combo list uploader
│   ├── ProxyManager.tsx           # Proxy management
│   ├── ThreadController.tsx       # Thread settings
│   ├── CheckerEngine.tsx          # Checker control panel
│   ├── ResultsTable.tsx           # Results display
│   └── StatsCard.tsx              # Statistics card
├── lib/
│   ├── checkers/
│   │   ├── base.ts                # Base checker class
│   │   ├── steam.ts               # Steam checker
│   │   ├── riot.ts                # Riot Games checker
│   │   ├── roblox.ts              # Roblox checker
│   │   ├── epic.ts                # Epic Games checker
│   │   ├── discord.ts             # Discord checker
│   │   ├── netflix.ts             # Netflix checker
│   │   ├── hotmail.ts             # Hotmail checker
│   │   ├── spotify.ts             # Spotify checker
│   │   └── instagram.ts           # Instagram checker
│   ├── utils/
│   │   ├── proxy.ts               # Proxy manager
│   │   └── threading.ts           # Thread manager
│   ├── platforms.ts               # Platform definitions
│   └── store.ts                   # Zustand state store
└── types/
    └── index.ts                   # TypeScript type definitions
```

## ⚠️ Legal Disclaimer

This tool is provided **for educational purposes only**. 

- Use this tool only on accounts you own or have explicit permission to test
- Unauthorized access to accounts is illegal and punishable by law
- The developers are not responsible for misuse of this software
- Always comply with terms of service and applicable laws

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is for educational purposes. Use responsibly and ethically.

## 🔧 Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Proxy Connection Issues
- Verify proxy format is correct
- Test proxy with a simple curl request
- Check proxy authentication credentials
- Try different proxy protocols (HTTP/SOCKS)

### Rate Limiting
- Reduce thread count
- Increase timeout value
- Enable proxy rotation
- Add delays between requests

## 📮 Support

For issues and questions, please open an issue on GitHub.

## 🚀 Roadmap

- [ ] Add more platform checkers
- [ ] Implement real-time WebSocket updates
- [ ] Add account validator before checking
- [ ] Implement combo deduplication
- [ ] Add checking history/logs
- [ ] Dark/Light theme toggle
- [ ] Mobile app version

---

Made with ❤️ by [ayutia623](https://github.com/ayutia623)
