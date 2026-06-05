import { Component, Input, Output, EventEmitter } from '@angular/core';
import { WorkItem } from '../../core/models';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe } from './badge.pipes';

@Component({
  selector: 'app-work-item-table',
  standalone: true,
  imports: [TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe],
  templateUrl: './work-item-table.component.html',
})
export class WorkItemTableComponent {
  @Input() items: WorkItem[] = [];
  @Output() itemClick   = new EventEmitter<WorkItem>();
  @Output() editClick   = new EventEmitter<WorkItem>();
  @Output() deleteClick = new EventEmitter<string>();

  constructor(
    private userService: UserService,
    private auth: AuthService,
  ) {}

  get isAdmin(): boolean { return this.auth.isAdmin; }

  userName(uid: string): string {
    return this.userService.getById(uid)?.name ?? '—';
  }
}
