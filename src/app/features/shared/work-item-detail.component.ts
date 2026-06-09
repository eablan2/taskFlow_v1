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
  @Output() close       = new EventEmitter<void>();
  @Output() edit        = new EventEmitter<WorkItem>();
  @Output() deleteClick = new EventEmitter<string>();

  comments: Comment[] = [];
  newComment = '';
  submitting = false;

  replyingTo: Comment | null = null;
  replyText = '';
  replyingSubmitting = false;

  emojiPickerFor: string | null = null; // comment id
  readonly EMOJIS = ['👍', '❤️', '😲', '😂', '😢'];

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

  topLevel(): Comment[] {
    return this.comments.filter(c => !c.parent_id);
  }

  repliesFor(id: string): Comment[] {
    return this.comments.filter(c => c.parent_id === id);
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

  startReply(comment: Comment): void {
    this.replyingTo = comment;
    this.replyText = '';
    this.emojiPickerFor = null;
  }

  cancelReply(): void {
    this.replyingTo = null;
    this.replyText = '';
  }

  submitReply(): void {
    const body = this.replyText.trim();
    if (!body || !this.replyingTo || this.replyingSubmitting) return;
    this.replyingSubmitting = true;
    this.commentService.addComment(this.item.id, body, this.replyingTo.id).subscribe(c => {
      this.comments.push(c);
      this.replyingTo = null;
      this.replyText = '';
      this.replyingSubmitting = false;
    });
  }

  toggleEmojiPicker(commentId: string): void {
    this.emojiPickerFor = this.emojiPickerFor === commentId ? null : commentId;
  }

  pickEmoji(comment: Comment, emoji: string): void {
    this.emojiPickerFor = null;
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

  activeReactions(comment: Comment): string[] {
    return this.EMOJIS.filter(e => (comment.reactions[e]?.length ?? 0) > 0);
  }
}
