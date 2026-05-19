import { Platform } from '@/types';

export const PLATFORMS: Platform[] = [
  // Email Platforms
  { id: 'hotmail', name: 'Hotmail/Outlook', category: 'email', enabled: true },
  { id: 'gmail', name: 'Gmail', category: 'email', enabled: true },
  { id: 'yahoo', name: 'Yahoo Mail', category: 'email', enabled: true },
  { id: 'protonmail', name: 'ProtonMail', category: 'email', enabled: true },
  
  // Gaming Platforms - PC
  { id: 'steam', name: 'Steam', category: 'gaming', enabled: true },
  { id: 'epic', name: 'Epic Games', category: 'gaming', enabled: true },
  { id: 'roblox', name: 'Roblox', category: 'gaming', enabled: true },
  { id: 'riot', name: 'Riot Games', category: 'gaming', enabled: true },
  { id: 'valorant', name: 'Valorant', category: 'gaming', enabled: true },
  { id: 'lol', name: 'League of Legends', category: 'gaming', enabled: true },
  { id: 'ea', name: 'EA Origin', category: 'gaming', enabled: true },
  { id: 'ubisoft', name: 'Ubisoft', category: 'gaming', enabled: true },
  { id: 'battlenet', name: 'Battle.net', category: 'gaming', enabled: true },
  { id: 'rockstar', name: 'Rockstar Games', category: 'gaming', enabled: true },
  { id: 'gog', name: 'GOG Galaxy', category: 'gaming', enabled: true },
  { id: 'bethesda', name: 'Bethesda', category: 'gaming', enabled: true },
  { id: 'minecraft', name: 'Minecraft', category: 'gaming', enabled: true },
  { id: 'gaijin', name: 'Gaijin.net', category: 'gaming', enabled: true },
  
  // Console Gaming
  { id: 'playstation', name: 'PlayStation Network', category: 'gaming', enabled: true },
  { id: 'xbox', name: 'Xbox Live', category: 'gaming', enabled: true },
  { id: 'nintendo', name: 'Nintendo Account', category: 'gaming', enabled: true },
  
  // Specific Games
  { id: 'fortnite', name: 'Fortnite', category: 'gaming', enabled: true },
  { id: 'csgo', name: 'CS:GO / CS2', category: 'gaming', enabled: true },
  { id: 'dota2', name: 'Dota 2', category: 'gaming', enabled: true },
  { id: 'apex', name: 'Apex Legends', category: 'gaming', enabled: true },
  { id: 'overwatch', name: 'Overwatch', category: 'gaming', enabled: true },
  { id: 'r6s', name: 'Rainbow Six Siege', category: 'gaming', enabled: true },
  { id: 'cod', name: 'Call of Duty', category: 'gaming', enabled: true },
  { id: 'warzone', name: 'Warzone', category: 'gaming', enabled: true },
  { id: 'gta5', name: 'GTA V Online', category: 'gaming', enabled: true },
  { id: 'rust', name: 'Rust', category: 'gaming', enabled: true },
  { id: 'ark', name: 'ARK: Survival', category: 'gaming', enabled: true },
  { id: 'tarkov', name: 'Escape from Tarkov', category: 'gaming', enabled: true },
  { id: 'wot', name: 'World of Tanks', category: 'gaming', enabled: true },
  { id: 'wows', name: 'World of Warships', category: 'gaming', enabled: true },
  { id: 'warthunder', name: 'War Thunder', category: 'gaming', enabled: true },

  
  // Mobile Gaming
  { id: 'pubgm', name: 'PUBG Mobile', category: 'mobile-gaming', enabled: true },
  { id: 'freefire', name: 'Free Fire', category: 'mobile-gaming', enabled: true },
  { id: 'mobilelegends', name: 'Mobile Legends', category: 'mobile-gaming', enabled: true },
  { id: 'codm', name: 'COD Mobile', category: 'mobile-gaming', enabled: true },
  { id: 'clashofclans', name: 'Clash of Clans', category: 'mobile-gaming', enabled: true },
  { id: 'clashroyale', name: 'Clash Royale', category: 'mobile-gaming', enabled: true },
  { id: 'brawlstars', name: 'Brawl Stars', category: 'mobile-gaming', enabled: true },
  { id: 'genshin', name: 'Genshin Impact', category: 'mobile-gaming', enabled: true },
  { id: 'honkai', name: 'Honkai Star Rail', category: 'mobile-gaming', enabled: true },
  { id: 'tof', name: 'Tower of Fantasy', category: 'mobile-gaming', enabled: true },
  { id: 'aov', name: 'Arena of Valor', category: 'mobile-gaming', enabled: true },
  { id: 'wildrift', name: 'Wild Rift', category: 'mobile-gaming', enabled: true },
  
  // Social Media
  { id: 'instagram', name: 'Instagram', category: 'social-media', enabled: true },
  { id: 'twitter', name: 'Twitter / X', category: 'social-media', enabled: true },
  { id: 'facebook', name: 'Facebook', category: 'social-media', enabled: true },
  { id: 'tiktok', name: 'TikTok', category: 'social-media', enabled: true },
  { id: 'discord', name: 'Discord', category: 'social-media', enabled: true },
  { id: 'snapchat', name: 'Snapchat', category: 'social-media', enabled: true },
  { id: 'telegram', name: 'Telegram', category: 'social-media', enabled: true },
  { id: 'reddit', name: 'Reddit', category: 'social-media', enabled: true },
  { id: 'pinterest', name: 'Pinterest', category: 'social-media', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', category: 'social-media', enabled: true },
  { id: 'twitch', name: 'Twitch', category: 'social-media', enabled: true },
  { id: 'youtube', name: 'YouTube', category: 'social-media', enabled: true },
  
  // Streaming Services
  { id: 'netflix', name: 'Netflix', category: 'streaming', enabled: true },
  { id: 'spotify', name: 'Spotify', category: 'streaming', enabled: true },
  { id: 'disney', name: 'Disney+', category: 'streaming', enabled: true },
  { id: 'hulu', name: 'Hulu', category: 'streaming', enabled: true },
  { id: 'prime', name: 'Amazon Prime Video', category: 'streaming', enabled: true },
  { id: 'hbo', name: 'HBO Max', category: 'streaming', enabled: true },
  { id: 'crunchyroll', name: 'Crunchyroll', category: 'streaming', enabled: true },
  { id: 'appletv', name: 'Apple TV+', category: 'streaming', enabled: true },
  { id: 'paramount', name: 'Paramount+', category: 'streaming', enabled: true },
  
  // Other Services
  { id: 'paypal', name: 'PayPal', category: 'other', enabled: true },
  { id: 'amazon', name: 'Amazon', category: 'other', enabled: true },
  { id: 'ebay', name: 'eBay', category: 'other', enabled: true },
  { id: 'nordvpn', name: 'NordVPN', category: 'other', enabled: true },
  { id: 'expressvpn', name: 'ExpressVPN', category: 'other', enabled: true },
  { id: 'surfshark', name: 'Surfshark', category: 'other', enabled: true },
  { id: 'canva', name: 'Canva', category: 'other', enabled: true },
  { id: 'dropbox', name: 'Dropbox', category: 'other', enabled: true },
];

export function getPlatformsByCategory(category: string): Platform[] {
  return PLATFORMS.filter(p => p.category === category);
}

export function getPlatformById(id: string): Platform | undefined {
  return PLATFORMS.find(p => p.id === id);
}

export function getAllPlatforms(): Platform[] {
  return PLATFORMS;
}
