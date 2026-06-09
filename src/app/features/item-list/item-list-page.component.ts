import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { WorkItem, ItemType } from '../../core/models';
import { WorkItemService } from '../../core/services/work-item.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';
import { WorkItemDetailComponent } from '../shared/work-item-detail.component';
import { TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe } from '../shared/badge.pipes';

@Component({
  selector: 'app-item-list-page',
  standalone: true,
  imports: [RouterLink, WorkItemModalComponent, WorkItemDetailComponent, TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe],
  templateUrl: './item-list-page.component.html',
})
export class ItemListPageComponent implements OnInit {
  epics: WorkItem[] = [];
  nonEpics: WorkItem[] = [];
  expanded = new Set<string>();

  selectedItem: WorkItem | null = null;
  editItem: WorkItem | null = null;
  showModal = false;

  constructor(
    private workItemService: WorkItemService,
    private userService: UserService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.workItemService.items$.subscribe(() => this.build());
  }

  private build(): void {
    const all = this.workItemService.getAll();
    this.epics    = all.filter(i => i.type === 'Epic');
    // Non-epics that are NOT linked under an epic
    const linkedUnderEpic = new Set(this.epics.flatMap(e => e.links));
    this.nonEpics = all.filter(i => i.type !== 'Epic' && !linkedUnderEpic.has(i.id));
  }

  childrenOf(epic: WorkItem): WorkItem[] {
    return epic.links
      .map(id => this.workItemService.getById(id))
      .filter((i): i is WorkItem => !!i && i.type !== 'Epic');
  }

  toggle(id: string): void {
    this.expanded.has(id) ? this.expanded.delete(id) : this.expanded.add(id);
  }

  isExpanded(id: string): boolean { return this.expanded.has(id); }

  get isAdmin(): boolean { return this.auth.isAdmin; }

  userName(uid: string): string { return this.userService.getById(uid)?.name ?? '—'; }

  openDetail(item: WorkItem): void { this.selectedItem = item; }
  openFull(item: WorkItem): void { this.router.navigate(['/items', item.id]); }
  openEdit(item: WorkItem, e?: Event): void { e?.stopPropagation(); this.editItem = item; this.showModal = true; }
  openCreate(): void { this.editItem = null; this.showModal = true; }
  closeModal(): void { this.showModal = false; this.editItem = null; }

  onDelete(id: string, e?: Event): void { e?.stopPropagation(); this.workItemService.delete(id).subscribe(); }
}
