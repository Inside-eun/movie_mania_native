import { Redis } from "@upstash/redis";
import fs from "fs";
import path from "path";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

function createRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export class CacheService {
  private redis: Redis | null = createRedisClient();
  private cacheDir: string;

  constructor() {
    const isVercel = process.env.VERCEL === "1";
    this.cacheDir = isVercel ? "/tmp/cache" : path.join(process.cwd(), ".cache");
    if (!this.redis) {
      console.warn("Upstash Redis 미설정 — 로컬 파일 캐시 사용");
      this.ensureCacheDir();
    }
  }

  private ensureCacheDir() {
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error) {
      console.warn("캐시 디렉토리 생성 실패:", error instanceof Error ? error.message : error);
    }
  }

  private generateCacheKey(type: string, date: string, params?: any): string {
    const dateStr = date.replace(/[^\d]/g, "");
    const paramStr = params ? JSON.stringify(params) : "";
    return `${type}_${dateStr}_${Buffer.from(paramStr).toString("base64")}`;
  }

  async get<T>(type: string, date: string, params?: any): Promise<T | null> {
    const key = this.generateCacheKey(type, date, params);

    if (this.redis) {
      try {
        const data = await this.redis.get<T>(key);
        if (data !== null && data !== undefined) {
          console.log(`Redis 캐시 히트: ${key}`);
          return data;
        }
      } catch (e) {
        console.warn("Redis 캐시 읽기 실패:", e);
      }
      console.log(`Redis 캐시 미스: ${key}`);
      return null;
    }

    return this.getFromFile<T>(key);
  }

  async set<T>(type: string, date: string, data: T, params?: any): Promise<void> {
    const key = this.generateCacheKey(type, date, params);

    if (this.redis) {
      try {
        await this.redis.set(key, data, { ex: 24 * 60 * 60 });
        console.log(`Redis 캐시 저장: ${key}`);
      } catch (e) {
        console.warn("Redis 캐시 저장 실패:", e);
      }
      return;
    }

    this.setToFile(key, data, 24 * 60 * 60 * 1000);
  }

  async delete(type: string, date: string, params?: any): Promise<void> {
    const key = this.generateCacheKey(type, date, params);
    if (this.redis) {
      await this.redis.del(key).catch(() => {});
    } else {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  }

  // params 여부와 무관하게 type+date 로 시작하는 키 전체 삭제
  async deleteAllByTypeDate(type: string, date: string): Promise<void> {
    const dateStr = date.replace(/[^\d]/g, "");
    const pattern = `${type}_${dateStr}_*`;

    if (this.redis) {
      let cursor = 0;
      do {
        const [next, keys] = await this.redis.scan(cursor, { match: pattern, count: 100 });
        cursor = Number(next);
        if (keys.length > 0) {
          await Promise.all(keys.map((k) => this.redis!.del(k).catch(() => {})));
        }
      } while (cursor !== 0);
      return;
    }

    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.startsWith(`${type}_${dateStr}_`) && file.endsWith(".json")) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
    } catch (e) {
      console.warn("패턴 캐시 삭제 실패:", e);
    }
  }

  // TMDB DB 전용 (Redis key: "tmdb_db")
  async getTmdbDb(): Promise<Record<string, any>> {
    if (this.redis) {
      try {
        const data = await this.redis.get<Record<string, any>>("tmdb_db");
        return data ?? {};
      } catch (e) {
        console.warn("TMDB DB Redis 읽기 실패:", e);
        return {};
      }
    }
    return this.loadTmdbDbFromFile();
  }

  async saveTmdbDb(db: Record<string, any>): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set("tmdb_db", db, { ex: 7 * 24 * 60 * 60 });
        console.log("TMDB DB Redis 저장 완료");
      } catch (e) {
        console.warn("TMDB DB Redis 저장 실패:", e);
      }
      return;
    }
    this.saveTmdbDbToFile(db);
  }

  private loadTmdbDbFromFile(): Record<string, any> {
    const filePath = path.join(this.cacheDir, "tmdb_db.json");
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(raw);
        return typeof data === "object" && data !== null ? data : {};
      }
    } catch (e) {
      console.warn("TMDB DB 파일 로드 실패:", e);
    }
    return {};
  }

  private saveTmdbDbToFile(db: Record<string, any>): void {
    const filePath = path.join(this.cacheDir, "tmdb_db.json");
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(db, null, 2), "utf-8");
    } catch (e) {
      console.warn("TMDB DB 파일 저장 실패:", e);
    }
  }

  cleanup(): void {
    if (this.redis) return; // Redis가 TTL 자동 관리
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (!file.endsWith(".json") || file === "tmdb_db.json") continue;
        const filePath = path.join(this.cacheDir, file);
        const item: CacheItem<any> = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Date.now() > item.expiresAt) {
          fs.unlinkSync(filePath);
          console.log(`만료된 캐시 파일 삭제: ${file}`);
        }
      }
    } catch (e) {
      console.error("캐시 정리 오류:", e);
    }
  }

  clear(): void {
    if (this.redis) {
      console.warn("Redis 전체 삭제는 Upstash 대시보드에서 수행하세요.");
      return;
    }
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith(".json")) fs.unlinkSync(path.join(this.cacheDir, file));
      }
      console.log("전체 캐시 삭제 완료");
    } catch (e) {
      console.error("캐시 삭제 오류:", e);
    }
  }

  getStats(): { memoryCount: number; fileCount: number; cacheHits: number } {
    let fileCount = 0;
    if (!this.redis) {
      try {
        fileCount = fs.readdirSync(this.cacheDir).filter((f) => f.endsWith(".json")).length;
      } catch {}
    }
    return { memoryCount: 0, fileCount, cacheHits: 0 };
  }

  async ping(): Promise<{ backend: "redis" | "file"; ok: boolean; latencyMs?: number; error?: string }> {
    if (this.redis) {
      const start = Date.now();
      try {
        await this.redis.set("__ping__", "pong", { ex: 10 });
        const val = await this.redis.get("__ping__");
        return { backend: "redis", ok: val === "pong", latencyMs: Date.now() - start };
      } catch (e) {
        return { backend: "redis", ok: false, error: e instanceof Error ? e.message : String(e) };
      }
    }
    const ok = fs.existsSync(this.cacheDir);
    return { backend: "file", ok };
  }

  private getFromFile<T>(key: string): T | null {
    const filePath = path.join(this.cacheDir, `${key}.json`);
    if (!fs.existsSync(filePath)) return null;
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const item: CacheItem<T> = JSON.parse(content);
      if (Date.now() > item.expiresAt) {
        fs.unlinkSync(filePath);
        return null;
      }
      console.log(`파일 캐시 히트: ${key}`);
      return item.data;
    } catch {
      return null;
    }
  }

  private setToFile<T>(key: string, data: T, ttlMs: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };
    try {
      const filePath = path.join(this.cacheDir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(item, null, 2));
      console.log(`파일 캐시 저장: ${key}`);
    } catch (e) {
      console.warn("파일 캐시 저장 실패:", e);
    }
  }
}

export const cacheService = new CacheService();
