import { Injectable } from '@angular/core';

/**
 * Thin wrapper around localStorage.
 * When migrating to a real backend, replace get/set with HTTP calls
 * and update callers (AuthService, WorkItemService, UserService).
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly PREFIX = 'tf_';

  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    localStorage.setItem(this.PREFIX + key, JSON.stringify(value));
  }

  remove(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }
}
