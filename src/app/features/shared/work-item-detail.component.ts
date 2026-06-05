import { Component, Input, Output, EventEmitter } from '@angular/core';
import { DatePipe } from '@angular/common';
import { WorkItem } from '../../core/models';
import { UserService } from '../../core/services/user.service';
import { WorkItemService } from '../../core/services/work-item.service';
import { AuthService } from '../../core/services/auth.service';
import { TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe } from './badge.pipes';

@Component({
  selector: 'app-work-item-detail',
  standalone: true,
  imports: [DatePipe, TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe],
  templateUrl: './work-item-detail.component.html',
})
export class WorkItemDetailComponent {
  @Input() item!: WorkItem;
  @Output() close        = new EventEmitter<void>();
  @Output() edit         = new EventEmitter<WorkItem>();
  @Output() deleteClick  = new EventEmitter<string>();

  constructor(
    private userService: UserService,
    private workItemService: WorkItemService,
    private auth: AuthService,
  ) {}

  get isAdmin(): boolean { return this.auth.isAdmin; }

  userName(uid: string): string {
    return this.userService.getById(uid)?.name ?? '—';
  }

  linkedItem(id: string): WorkItem | undefined {
    return this.workItemService.getById(id);
  }

  openLinked(id: string): void {
    const linked = this.linkedItem(id);
    if (linked) this.edit.emit(linked); // re-use edit emitter to navigate to linked item's detail
  }
}
