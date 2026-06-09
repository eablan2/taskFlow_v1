import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { DatePipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkItem, Comment } from '../../core/models';
import { UserService } from '../../core/services/user.service';
import { WorkItemService } from '../../core/services/work-item.service';
import { AuthService } from '../../core/services/auth.service';
import { CommentService } from '../../core/services/comment.service';
import { TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe } from './badge.pipes';

@Component({
  selector: 'app-work-item-detail',
  standalone: true,
  imports: [DatePipe, NgFor, NgIf, FormsModule, TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe],
  templateUrl: './work-item-detail.component.html',
})
export class WorkItemDetailComponent implements OnInit, OnChanges {
  @Input() item!: WorkItem;
  @Output() close        = new EventEmitter<void>();
  @Output() edit         = new EventEmitter<WorkItem>();
  @Output() deleteClick  = new EventEmitter<string>();

  comments: Comment[] = [];
  newComment = '';
  submitting = false;

  readonly EMOJIS = ['👍', '❤️', '😮', '😂', '😢'];

  constructor(
    private userService: UserService,
    private workItemService: WorkItemService,
    private auth: AuthService,
    private commentService: CommentService,
  ) {}

  ngOnInit(): void { this.loadComments(); }
  ngOnChanges(): void { this.loadComments(); }

  private loadComments(): void {
    if (!this.item) return;
    this.commentService.getComments(this.item.id).subscribe(c => this.comments = c);
  }

  get isAdmin(): boolean { return this.auth.isAdmin; }
  get currentUserId(): string { return this.auth.currentUser?.id ?? ''; }

  userName(uid: string): string {
    return this.userService.getById(uid)?.name ?? '—';
  }

  linkedItem(id: string): WorkItem | undefined {
    return this.workItemService.getById(id);
  }

  submitComment(): void {
    const body = this.newComment.trim();
    if (!body || this.submitting) return;
    this.submitting = true;
    this.commentService.addComment(this.item.id, body).subscribe(c => {
      this.comments.push(c);
      this.newComment = '';
      this.submitting = false;
    });
  }

  toggleReaction(comment: Comment, emoji: string): void {
    this.commentService.toggleReaction(this.item.id, comment.id, emoji).subscribe(reactions => {
      comment.reactions = reactions;
    });
  }

  reactionCount(comment: Comment, emoji: string): number {
    return comment.reactions[emoji]?.length ?? 0;
  }

  hasReacted(comment: Comment, emoji: string): boolean {
    return comment.reactions[emoji]?.includes(this.currentUserId) ?? false;
  }
}
