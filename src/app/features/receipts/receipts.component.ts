import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { ReceiptService } from '../../core/services/receipt.service';
import { Receipt, ReceiptCategory } from '../../core/models';

const CATEGORIES: ReceiptCategory[] = ['Food', 'Travel', 'Office', 'Software', 'Utilities', 'Entertainment', 'Other'];

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [FormsModule, DatePipe, DecimalPipe, NgTemplateOutlet],
  templateUrl: './receipts.component.html',
})
export class ReceiptsComponent implements OnInit, OnDestroy {
  receipts: Receipt[] = [];
  categories = CATEGORIES;

  showForm = signal(false);
  editTarget: Receipt | null = null;
  previewReceipt: Receipt | null = null;
  deleteConfirm: string | null = null;

  activeTab: 'all' | 'monthly' = 'all';

  filterCategory: ReceiptCategory | '' = '';
  filterPaid: 'all' | 'paid' | 'unpaid' = 'all';
  sortBy: 'date' | 'amount' | 'name' = 'date';

  selectedMonth: string = new Date().toISOString().slice(0, 7); // YYYY-MM

  form = {
    name: '',
    amount: 0,
    category: 'Other' as ReceiptCategory,
    date: new Date().toISOString().slice(0, 10),
    notes: '',
    imageData: '',
    imageName: '',
    paid: false,
  };

  private destroy$ = new Subject<void>();

  constructor(private receiptService: ReceiptService) {}

  ngOnInit(): void {
    this.receiptService.receipts$.pipe(takeUntil(this.destroy$)).subscribe(r => this.receipts = r);
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  get filtered(): Receipt[] {
    let list = this.filterCategory
      ? this.receipts.filter(r => r.category === this.filterCategory)
      : [...this.receipts];

    if (this.filterPaid === 'paid')   list = list.filter(r => r.paid);
    if (this.filterPaid === 'unpaid') list = list.filter(r => !r.paid);

    if (this.sortBy === 'date')   list.sort((a, b) => b.date.localeCompare(a.date));
    if (this.sortBy === 'amount') list.sort((a, b) => b.amount - a.amount);
    if (this.sortBy === 'name')   list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }

  get grandTotal(): number {
    return this.filtered.reduce((s, r) => s + r.amount, 0);
  }

  get paidTotal(): number {
    return this.filtered.filter(r => r.paid).reduce((s, r) => s + r.amount, 0);
  }

  get unpaidTotal(): number {
    return this.filtered.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0);
  }

  get categoryBreakdown() { return this.receiptService.getTotalByCategory(); }

  get monthlyReceipts(): Receipt[] {
    const list = this.receipts.filter(r => r.date.startsWith(this.selectedMonth));
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  get monthlyTotal(): number { return this.monthlyReceipts.reduce((s, r) => s + r.amount, 0); }
  get monthlyPaid(): number  { return this.monthlyReceipts.filter(r => r.paid).reduce((s, r) => s + r.amount, 0); }
  get monthlyUnpaid(): number { return this.monthlyReceipts.filter(r => !r.paid).reduce((s, r) => s + r.amount, 0); }

  get monthlyCategoryBreakdown() {
    const map = new Map<ReceiptCategory, { total: number; count: number }>();
    for (const r of this.monthlyReceipts) {
      const e = map.get(r.category) ?? { total: 0, count: 0 };
      map.set(r.category, { total: e.total + r.amount, count: e.count + 1 });
    }
    return Array.from(map.entries())
      .map(([category, v]) => ({ category, ...v }))
      .sort((a, b) => b.total - a.total);
  }

  get availableMonths(): { value: string; label: string }[] {
    const months = [...new Set(this.receipts.map(r => r.date.slice(0, 7)))].sort().reverse();
    return months.map(m => {
      const [year, month] = m.split('-');
      const label = new Date(+year, +month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      return { value: m, label };
    });
  }

  get selectedMonthLabel(): string {
    const [year, month] = this.selectedMonth.split('-');
    return new Date(+year, +month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    const [y, m] = this.selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    this.selectedMonth = d.toISOString().slice(0, 7);
  }

  nextMonth(): void {
    const [y, m] = this.selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    this.selectedMonth = d.toISOString().slice(0, 7);
  }

  togglePaid(r: Receipt): void {
    this.receiptService.update(r.id, { paid: !r.paid });
  }

  openCreate(): void {
    this.editTarget = null;
    this.form = { name: '', amount: 0, category: 'Other', date: new Date().toISOString().slice(0, 10), notes: '', imageData: '', imageName: '', paid: false };
    this.showForm.set(true);
  }

  openEdit(r: Receipt): void {
    this.editTarget = r;
    this.form = { name: r.name, amount: r.amount, category: r.category, date: r.date, notes: r.notes, imageData: r.imageData, imageName: r.imageName, paid: r.paid };
    this.showForm.set(true);
  }

  closeForm(): void { this.showForm.set(false); this.editTarget = null; }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.form.imageName = file.name;
    const reader = new FileReader();
    reader.onload = e => this.form.imageData = e.target?.result as string ?? '';
    reader.readAsDataURL(file);
  }

  saveForm(): void {
    if (!this.form.name.trim() || this.form.amount <= 0) return;
    if (this.editTarget) {
      this.receiptService.update(this.editTarget.id, { ...this.form });
    } else {
      this.receiptService.add({ ...this.form });
    }
    this.closeForm();
  }

  confirmDelete(id: string): void { this.deleteConfirm = id; }
  cancelDelete(): void { this.deleteConfirm = null; }
  doDelete(): void {
    if (this.deleteConfirm) { this.receiptService.delete(this.deleteConfirm); }
    this.deleteConfirm = null;
  }

  openPreview(r: Receipt): void { this.previewReceipt = r; }
  closePreview(): void { this.previewReceipt = null; }

  categoryColor(cat: ReceiptCategory): string {
    const map: Record<ReceiptCategory, string> = {
      Food: 'var(--story)', Travel: 'var(--accent)', Office: 'var(--feature)',
      Software: 'var(--epic)', Utilities: 'var(--task)', Entertainment: 'var(--warn)', Other: 'var(--text3)',
    };
    return map[cat];
  }

  isImage(imageName: string): boolean {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(imageName);
  }
}
