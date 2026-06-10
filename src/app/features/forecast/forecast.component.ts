import { Component, ViewEncapsulation, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

export interface ForecastEntry {
  id: number;
  label: string;
  type: 'income' | 'cost';
  monthlyAmount: number;
  startMonth: number;
  endMonth: number;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_LABELS = Array.from({ length: 12 }, (_, i) => `${MONTHS[i]} ${CURRENT_YEAR}`);
const BALANCE_KEY = 'tf_forecast_balance';
const PRIVILEGED_USERNAMES = ['treasurer', 'president'];

@Component({
  selector: 'app-forecast',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecast.component.html',
  styleUrl: './forecast.component.css',
  encapsulation: ViewEncapsulation.None,
})
export class ForecastComponent {
  readonly months = MONTH_LABELS;
  readonly monthsShort = MONTHS;

  entries = signal<ForecastEntry[]>([
    { id: 1, label: 'Product Revenue', type: 'income', monthlyAmount: 12000, startMonth: 0, endMonth: 11 },
    { id: 2, label: 'Consulting', type: 'income', monthlyAmount: 4000, startMonth: 0, endMonth: 11 },
    { id: 3, label: 'Salaries', type: 'cost', monthlyAmount: 8000, startMonth: 0, endMonth: 11 },
    { id: 4, label: 'Infrastructure', type: 'cost', monthlyAmount: 1200, startMonth: 0, endMonth: 11 },
  ]);

  nextId = signal(5);

  // Balance
  balance = signal<number>(parseFloat(localStorage.getItem(BALANCE_KEY) ?? '0'));
  editingBalance = signal(false);
  balanceDraft = signal(0);

  // Form state
  newLabel = signal('');
  newType = signal<'income' | 'cost'>('income');
  newAmount = signal(0);
  newStart = signal(0);
  newEnd = signal(11);

  // Chart dimensions
  readonly chartW = 800;
  readonly chartH = 320;
  readonly padL = 72;
  readonly padR = 24;
  readonly padT = 24;
  readonly padB = 48;

  constructor(private auth: AuthService) {}

  canEditBalance = computed(() => {
    const user = this.auth.currentUser;
    return user?.role === 'admin' || PRIVILEGED_USERNAMES.includes(user?.username ?? '');
  });

  monthlyTotals = computed(() => {
    const es = this.entries();
    return Array.from({ length: 12 }, (_, m) => {
      let income = 0, cost = 0;
      for (const e of es) {
        if (m >= e.startMonth && m <= e.endMonth) {
          if (e.type === 'income') income += e.monthlyAmount;
          else cost += e.monthlyAmount;
        }
      }
      return { income, cost, net: income - cost };
    });
  });

  chartData = computed(() => {
    const totals = this.monthlyTotals();
    const allVals = totals.flatMap(t => [t.income, t.cost, t.net]);
    const maxVal = Math.max(...allVals, 1);
    const minVal = Math.min(...allVals, 0);
    const range = maxVal - minVal || 1;

    const innerW = this.chartW - this.padL - this.padR;
    const innerH = this.chartH - this.padT - this.padB;
    const stepX = innerW / 11;

    const toY = (v: number) =>
      this.padT + innerH - ((v - minVal) / range) * innerH;

    const toX = (i: number) => this.padL + i * stepX;

    const incomePts = totals.map((t, i) => `${toX(i)},${toY(t.income)}`).join(' ');
    const costPts   = totals.map((t, i) => `${toX(i)},${toY(t.cost)}`).join(' ');
    const netPts    = totals.map((t, i) => `${toX(i)},${toY(t.net)}`).join(' ');

    const ticks = 5;
    const gridLines = Array.from({ length: ticks + 1 }, (_, i) => {
      const val = minVal + (range / ticks) * i;
      const y = toY(val);
      return { y, label: this.formatK(val) };
    });

    const zeroY = toY(0);

    return { incomePts, costPts, netPts, gridLines, zeroY, toX, toY, totals, minVal, maxVal };
  });

  formatK(v: number): string {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
    if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
    return `${sign}$${abs.toFixed(0)}`;
  }

  startEditBalance() {
    this.balanceDraft.set(this.balance());
    this.editingBalance.set(true);
  }

  saveBalance() {
    const val = this.balanceDraft();
    this.balance.set(val);
    localStorage.setItem(BALANCE_KEY, String(val));
    this.editingBalance.set(false);
  }

  cancelEditBalance() {
    this.editingBalance.set(false);
  }

  addEntry() {
    if (!this.newLabel().trim() || this.newAmount() <= 0) return;
    this.entries.update(es => [...es, {
      id: this.nextId(),
      label: this.newLabel().trim(),
      type: this.newType(),
      monthlyAmount: this.newAmount(),
      startMonth: this.newStart(),
      endMonth: this.newEnd(),
    }]);
    this.nextId.update(n => n + 1);
    this.newLabel.set('');
    this.newAmount.set(0);
  }

  removeEntry(id: number) {
    this.entries.update(es => es.filter(e => e.id !== id));
  }

  updateEntry(id: number, field: keyof ForecastEntry, value: any) {
    this.entries.update(es => es.map(e =>
      e.id === id ? { ...e, [field]: field === 'monthlyAmount' || field === 'startMonth' || field === 'endMonth' ? +value : value } : e
    ));
  }

  get incomeEntries() { return this.entries().filter(e => e.type === 'income'); }
  get costEntries()   { return this.entries().filter(e => e.type === 'cost'); }

  totalIncome = computed(() => this.monthlyTotals().reduce((s, t) => s + t.income, 0));
  totalCost   = computed(() => this.monthlyTotals().reduce((s, t) => s + t.cost, 0));
  totalNet    = computed(() => this.totalIncome() - this.totalCost());

  projectedBalance = computed(() => this.balance() + this.totalNet());

  monthRange = Array.from({ length: 12 }, (_, i) => ({ value: i, label: `${MONTHS[i]} ${CURRENT_YEAR}` }));

  readonly currentYear = CURRENT_YEAR;
}
