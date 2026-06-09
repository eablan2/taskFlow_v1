import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { WorkItemService } from '../../core/services/work-item.service';
import { UserService } from '../../core/services/user.service';
import { WorkItem, WorkItemFilters, ItemType, ItemStatus, ItemPriority, User } from '../../core/models';
import { WorkItemTableComponent } from '../shared/work-item-table.component';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';
import { WorkItemDetailComponent } from '../shared/work-item-detail.component';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [FormsModule, AsyncPipe, WorkItemTableComponent, WorkItemModalComponent, WorkItemDetailComponent],
  templateUrl: './backlog.component.html',
})
export class BacklogComponent implements OnInit, OnDestroy {
  items: WorkItem[] = [];
  filters: WorkItemFilters = {};

  selectedItem: WorkItem | null = null;
  editItem: WorkItem | null = null;
  showModal = false;

  readonly TYPES: (ItemType | '')[]     = ['', 'Epic', 'Feature', 'User Story', 'Task'];
  readonly STATUSES: (ItemStatus | '')[] = ['', 'New', 'Active', 'In Review', 'Done', 'Blocked'];
  readonly PRIORITIES: (ItemPriority | '')[] = ['', 'Critical', 'High', 'Medium', 'Low'];

  private destroy$ = new Subject<void>();

  get users(): User[] { return this.userService.getNonAdmin(); }

  constructor(private workItemService: WorkItemService, private userService: UserService) {}

  ngOnInit(): void {
    this.workItemService.filteredItems$
      .pipe(takeUntil(this.destroy$))
      .subscribe(items => (this.items = items));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.workItemService.clearFilters();
  }

  onFilterChange(): void {
    this.workItemService.setFilters(this.filters);
  }

  openEdit(item: WorkItem): void { this.editItem = item; this.showModal = true; }
  openCreate(): void { this.editItem = null; this.showModal = true; }
  closeModal(): void { this.showModal = false; this.editItem = null; }

  onDelete(id: string): void {
    this.workItemService.delete(id).subscribe();
  }
}
