import { Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  // 简单的内存缓存作为后备方案
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    try {
      // 尝试使用 cache-manager
      const result = await this.cacheManager.get<T>(key);
      if (result !== undefined) {
        return result;
      }
    } catch (e) {
      // 如果 cache-manager 失败，使用内存缓存
    }

    // 回退到内存缓存
    const cached = this.memoryCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    this.memoryCache.delete(key);
    return undefined;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      // 尝试使用 cache-manager
      await this.cacheManager.set(key, value, ttl ?? 3600);
    } catch (e) {
      // 回退到内存缓存
    }
    // 同时存入内存缓存
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + (ttl ?? 3600) * 1000,
    });
  }

  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
    } catch (e) {
      // 忽略错误
    }
    this.memoryCache.delete(key);
  }
}
