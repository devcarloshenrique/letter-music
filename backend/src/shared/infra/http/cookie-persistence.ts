import * as fs from 'fs/promises';
import * as path from 'path';
import { CookieJar, Cookie } from 'tough-cookie';

export class CookiePersistence {
  private readonly filePath: string;

  constructor(filePath: string = '.data/letras-cookies.json') {
    this.filePath = path.resolve(process.cwd(), filePath);
  }

  async saveCookies(jar: CookieJar): Promise<void> {
    try {
      const serialized = jar.serializeSync();
      const dir = path.dirname(this.filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(
        this.filePath,
        JSON.stringify(serialized, null, 2),
        'utf-8'
      );
      console.log(`[CookiePersistence] Cookies saved to ${this.filePath}`);
    } catch (error) {
      console.error('[CookiePersistence] Error saving cookies:', error);
    }
  }

  async loadCookies(jar: CookieJar): Promise<void> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const serialized = JSON.parse(data);
      
      // Deserialize into the provided jar
      const deserializedJar = CookieJar.deserializeSync(serialized);
      
      // Manually copy cookies over to preserve the existing instance reference
      const store = (deserializedJar as any).store;
      if (store && store.idx) {
        (jar as any).store = store;
      }
      console.log(`[CookiePersistence] Cookies loaded from ${this.filePath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('[CookiePersistence] Error loading cookies:', error);
      } else {
        console.log('[CookiePersistence] No existing cookie file found. Starting fresh.');
      }
    }
  }

  async clearCookies(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
      console.log(`[CookiePersistence] Cookies cleared from ${this.filePath}`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        console.error('[CookiePersistence] Error clearing cookies:', error);
      }
    }
  }
}
