import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { WorkItemService } from '../../core/services/work-item.service';
import { WorkItem } from '../../core/models';
import { WorkItemTableComponent } from '../shared/work-item-table.component';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';
import { WorkItemDetailComponent } from '../shared/work-item-detail.component';

interface StatCard  { label: string; value: number | string; sub: string; color: string; }
interface BarEntry  { label: string; count: number; pct: number; color: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [WorkItemTableComponent, WorkItemModalComponent, WorkItemDetailComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit, OnDestroy {
  stats: StatCard[]  = [];
  typeChart: BarEntry[]   = [];
  statusChart: BarEntry[] = [];
  recentItems: WorkItem[] = [];

  selectedItem: WorkItem | null = null;
  editItem: WorkItem | null = null;
  showModal = false;

  private destroy$ = new Subject<void>();

  constructor(
    private workItemService: WorkItemService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.workItemService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => this.buildView());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildView(): void {
    const s = this.workItemService.getStats();
    this.recentItems = this.workItemService.getRecent(8);

    this.stats = [
      { label: 'Total Items',   value: s.total,  sub: 'across all types',                                                   color: 'var(--accent)'  },
      { label: 'Done',          value: s.done,   sub: `${s.total ? Math.round(s.done / s.total * 100) : 0}% complete`,      color: 'var(--story)'   },
      { label: 'Active',        value: s.active, sub: 'in progress',                                                        color: 'var(--feature)' },
      { label: 'Story Points',  value: s.points, sub: 'total scope',                                                        color: 'var(--epic)'    },
    ];

    const typeColors   = ['var(--epic)', 'var(--feature)', 'var(--story)', 'var(--task)'];
    const maxType      = Math.max(...s.byType.map(x => x.count), 1);
    this.typeChart     = s.byType.map((x, i) => ({ ...x, pct: x.count / maxType * 100, color: typeColors[i] }));

    const statusColors = ['var(--text3)', 'var(--accent)', 'var(--warn)', 'var(--story)', 'var(--danger)'];
    const maxStatus    = Math.max(...s.byStatus.map(x => x.count), 1);
    this.statusChart   = s.byStatus.map((x, i) => ({ ...x, pct: x.count / maxStatus * 100, color: statusColors[i] }));
  }

  openDetail(item: WorkItem): void { this.selectedItem = item; }
  closeDetail(): void              { this.selectedItem = null; }
  openEdit(item: WorkItem): void   { this.editItem = item; this.showModal = true; this.selectedItem = null; }
  openCreate(): void               { this.editItem = null; this.showModal = true; }
  closeModal(): void               { this.showModal = false; this.editItem = null; }

  onDelete(id: string): void {
    this.workItemService.delete(id).subscribe();
  }
}
