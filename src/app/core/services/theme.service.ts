import { Injectable, signal, effect } from '@angular/core';
import { StorageService } from './storage.service';

export type Theme = 'dark' | 'light';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'theme';

  theme = signal<Theme>(this.loadTheme());

  constructor(private storage: StorageService) {
    // Apply theme to <html> element whenever the signal changes
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      this.storage.set(this.STORAGE_KEY, t);
    });
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
  }

  get isDark(): boolean {
    return this.theme() === 'dark';
  }

  private loadTheme(): Theme {
    const stored = this.storage.get<Theme>(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    // Fall back to OS preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
