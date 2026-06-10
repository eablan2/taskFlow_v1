import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Receipt, ReceiptCategory } from '../models';

const STORAGE_KEY = 'tf_receipts';

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private _receipts = new BehaviorSubject<Receipt[]>(this.load());
  receipts$ = this._receipts.asObservable();

  get receipts(): Receipt[] { return this._receipts.value; }

  private load(): Receipt[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private save(receipts: Receipt[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
    this._receipts.next(receipts);
  }

  add(receipt: Omit<Receipt, 'id' | 'created'>): Receipt {
    const newReceipt: Receipt = {
      ...receipt,
      id: crypto.randomUUID(),
      created: Date.now(),
    };
    this.save([...this.receipts, newReceipt]);
    return newReceipt;
  }

  update(id: string, changes: Partial<Omit<Receipt, 'id' | 'created'>>): void {
    this.save(this.receipts.map(r => r.id === id ? { ...r, ...changes } : r));
  }

  delete(id: string): void {
    this.save(this.receipts.filter(r => r.id !== id));
  }

  getTotal(): number {
    return this.receipts.reduce((sum, r) => sum + r.amount, 0);
  }

  getTotalByCategory(): { category: ReceiptCategory; total: number; count: number }[] {
    const map = new Map<ReceiptCategory, { total: number; count: number }>();
    for (const r of this.receipts) {
      const existing = map.get(r.category) ?? { total: 0, count: 0 };
      map.set(r.category, { total: existing.total + r.amount, count: existing.count + 1 });
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  }
}
