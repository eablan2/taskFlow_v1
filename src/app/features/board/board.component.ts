import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { WorkItemService } from '../../core/services/work-item.service';
import { WorkItem, ItemStatus, ItemType } from '../../core/models';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';
import { WorkItemDetailComponent } from '../shared/work-item-detail.component';
import { TypeCssPipe, DotCssPipe } from '../shared/badge.pipes';

interface KanbanColumn {
  status: ItemStatus;
  color: string;
  items: WorkItem[];
  typeFilter: ItemType | '';
}

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [FormsModule, WorkItemModalComponent, WorkItemDetailComponent, TypeCssPipe, DotCssPipe],
  templateUrl: './board.component.html',
})
export class BoardComponent implements OnInit, OnDestroy {
  columns: KanbanColumn[] = [];
  selectedItem: WorkItem | null = null;
  editItem: WorkItem | null = null;
  showModal = false;

  readonly TYPES: (ItemType | '')[] = ['', 'Epic', 'Feature', 'User Story', 'Task'];

  private readonly STATUS_COLORS: Record<ItemStatus, string> = {
    New:         'var(--text3)',
    Active:      'var(--accent)',
    'In Review': 'var(--warn)',
    Done:        'var(--story)',
    Blocked:     'var(--danger)',
  };

  private destroy$ = new Subject<void>();

  constructor(private workItemService: WorkItemService) {}

  ngOnInit(): void {
    this.workItemService.items$.pipe(takeUntil(this.destroy$)).subscribe(() => this.renderBoard());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  renderBoard(): void {
    const all = this.workItemService.getAll();
    // Preserve existing per-column filters across re-renders
    const prevFilters = Object.fromEntries(this.columns.map(c => [c.status, c.typeFilter]));

    this.columns = this.workItemService.STATUSES.map(status => {
      const typeFilter: ItemType | '' = prevFilters[status] ?? '';
      const colItems = all.filter(i => i.status === status);
      return {
        status,
        color: this.STATUS_COLORS[status],
        typeFilter,
        items: typeFilter ? colItems.filter(i => i.type === typeFilter) : colItems,
      };
    });
  }

  filterColumn(col: KanbanColumn): void {
    const all = this.workItemService.getAll().filter(i => i.status === col.status);
    col.items = col.typeFilter ? all.filter(i => i.type === col.typeFilter) : all;
  }

  openDetail(item: WorkItem): void { this.selectedItem = item; }
  openEdit(item: WorkItem): void   { this.editItem = item; this.showModal = true; }
  openCreate(): void               { this.editItem = null; this.showModal = true; }

  onDelete(id: string): void {
    this.workItemService.delete(id).subscribe();
    this.selectedItem = null;
  }

  closeModal(): void {
    this.showModal = false;
    this.editItem = null;
  }
}
