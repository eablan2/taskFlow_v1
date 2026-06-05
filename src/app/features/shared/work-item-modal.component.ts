import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkItem, ItemType, ItemStatus, ItemPriority } from '../../core/models';
import { WorkItemService } from '../../core/services/work-item.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { TypeCssPipe, DotCssPipe } from './badge.pipes';

interface ItemForm {
  type: ItemType;
  title: string;
  desc: string;
  status: ItemStatus;
  priority: ItemPriority;
  assignee: string;
  points: number | null;
  due: string;
  links: string[];
}

@Component({
  selector: 'app-work-item-modal',
  standalone: true,
  imports: [FormsModule, TypeCssPipe, DotCssPipe],
  templateUrl: './work-item-modal.component.html',
})
export class WorkItemModalComponent implements OnInit {
  @Input() item: WorkItem | null = null;
  @Output() saved     = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  form: ItemForm = {
    type: 'User Story', title: '', desc: '', status: 'New',
    priority: 'Medium', assignee: '', points: null, due: '', links: [],
  };

  allItems: WorkItem[] = [];
  users = this.userService.getAll();

  readonly TYPES: ItemType[]          = ['Epic', 'Feature', 'User Story', 'Task'];
  readonly STATUSES: ItemStatus[]     = ['New', 'Active', 'In Review', 'Done', 'Blocked'];
  readonly PRIORITIES: ItemPriority[] = ['Critical', 'High', 'Medium', 'Low'];

  constructor(
    private workItemService: WorkItemService,
    private userService: UserService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (this.item) {
      this.form = {
        type: this.item.type, title: this.item.title, desc: this.item.desc,
        status: this.item.status, priority: this.item.priority,
        assignee: this.item.assignee, points: this.item.points || null,
        due: this.item.due, links: [...this.item.links],
      };
    }
    this.allItems = this.workItemService.getAll();
    // Also subscribe so users list reflects any lazy-loaded data
    this.userService.users$.subscribe(users => (this.users = users));
  }

  get title(): string {
    return this.item ? `Edit item — ${this.item.id}` : 'Create item';
  }

  get linkOptions(): WorkItem[] {
    return this.allItems.filter(i => i.id !== this.item?.id && !this.form.links.includes(i.id));
  }

  getLinkedItem(id: string): WorkItem | undefined {
    return this.allItems.find(i => i.id === id);
  }

  addLink(event: Event): void {
    const sel = event.target as HTMLSelectElement;
    if (sel.value && !this.form.links.includes(sel.value)) {
      this.form.links = [...this.form.links, sel.value];
    }
    sel.value = '';
  }

  removeLink(id: string): void {
    this.form.links = this.form.links.filter(l => l !== id);
  }

  save(): void {
    if (!this.form.title.trim()) {
      this.toast.show('Title is required.', 'error');
      return;
    }
    const payload = {
      ...this.form,
      title:  this.form.title.trim(),
      desc:   this.form.desc.trim(),
      points: this.form.points ?? 0,
    };

    if (this.item) {
      this.workItemService.update(this.item.id, payload).subscribe(() => {
        this.toast.show(`${this.item!.id} updated.`);
        this.saved.emit();
      });
    } else {
      this.workItemService.create(payload).subscribe(created => {
        this.toast.show(`${created.id} created.`);
        this.saved.emit();
      });
    }
  }

  cancel(): void {
    this.cancelled.emit();
  }
}
