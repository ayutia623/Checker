import { Proxy, ProxyType } from '@/types';
import { HttpsProxyAgent } from 'https-proxy-agent';
import { SocksProxyAgent } from 'socks-proxy-agent';

export class ProxyManager {
  private proxies: Proxy[] = [];
  private currentIndex = 0;

  constructor(proxies: Proxy[]) {
    this.proxies = proxies;
  }

  getNext(): Proxy | null {
    if (this.proxies.length === 0) return null;
    
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;
    return proxy;
  }

  getRandom(): Proxy | null {
    if (this.proxies.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[randomIndex];
  }

  getAgent(proxy: Proxy) {
    const auth = proxy.username && proxy.password 
      ? `${proxy.username}:${proxy.password}@`
      : '';
    
    const proxyUrl = `${proxy.type}://${auth}${proxy.host}:${proxy.port}`;

    if (proxy.type === 'socks4' || proxy.type === 'socks5') {
      return new SocksProxyAgent(proxyUrl);
    } else {
      return new HttpsProxyAgent(proxyUrl);
    }
  }

  static parseProxyList(content: string): Proxy[] {
    const lines = content.split('\n').filter(line => line.trim());
    const proxies: Proxy[] = [];

    for (const line of lines) {
      const proxy = this.parseProxyLine(line);
      if (proxy) proxies.push(proxy);
    }

    return proxies;
  }



  static parseProxyLine(line: string): Proxy | null {
    try {
      // Format: type://host:port or type://user:pass@host:port or host:port
      const match = line.match(/^(?:(https?|socks[45]):\/\/)?(?:([^:@]+):([^@]+)@)?([^:]+):(\d+)$/);
      
      if (!match) return null;

      const [, type, username, password, host, port] = match;

      return {
        host,
        port: parseInt(port),
        type: (type as ProxyType) || 'http',
        username,
        password,
      };
    } catch {
      return null;
    }
  }
}

export function parseComboList(content: string): Array<{ email: string; password: string }> {
  const lines = content.split('\n').filter(line => line.trim());
  const combos: Array<{ email: string; password: string }> = [];

  for (const line of lines) {
    const [email, password] = line.split(':').map(s => s.trim());
    if (email && password) {
      combos.push({ email, password });
    }
  }

  return combos;
}

export async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
