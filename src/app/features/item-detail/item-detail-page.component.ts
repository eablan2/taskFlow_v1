import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WorkItem, Comment } from '../../core/models';
import { WorkItemService } from '../../core/services/work-item.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { CommentService } from '../../core/services/comment.service';
import { WorkItemModalComponent } from '../shared/work-item-modal.component';
import { TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe } from '../shared/badge.pipes';

@Component({
  selector: 'app-item-detail-page',
  standalone: true,
  imports: [DatePipe, FormsModule, RouterLink, WorkItemModalComponent,
            TypeCssPipe, DotCssPipe, StatusCssPipe, PriorityCssPipe],
  templateUrl: './item-detail-page.component.html',
})
export class ItemDetailPageComponent implements OnInit {
  item: WorkItem | null = null;
  comments: Comment[] = [];
  newComment = '';
  submitting = false;
  replyingTo: Comment | null = null;
  replyText = '';
  replyingSubmitting = false;
  emojiPickerFor: string | null = null;
  showModal = false;

  readonly EMOJIS = ['👍', '❤️', '😲', '😂', '😢'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private workItemService: WorkItemService,
    private userService: UserService,
    private auth: AuthService,
    private commentService: CommentService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.workItemService.items$.subscribe(() => {
      this.item = this.workItemService.getById(id) ?? null;
      if (!this.item) return;
      if (this.comments.length === 0) this.loadComments();
    });
  }

  private loadComments(): void {
    if (!this.item) return;
    this.commentService.getComments(this.item.id).subscribe(c => this.comments = c);
  }

  get isAdmin(): boolean { return this.auth.isAdmin; }
  get currentUserId(): string { return this.auth.currentUser?.id ?? ''; }

  userName(uid: string): string { return this.userService.getById(uid)?.name ?? '—'; }
  linkedItem(id: string): WorkItem | undefined { return this.workItemService.getById(id); }

  topLevel(): Comment[] { return this.comments.filter(c => !c.parent_id); }
  repliesFor(id: string): Comment[] { return this.comments.filter(c => c.parent_id === id); }

  submitComment(): void {
    const body = this.newComment.trim();
    if (!body || this.submitting || !this.item) return;
    this.submitting = true;
    this.commentService.addComment(this.item.id, body).subscribe(c => {
      this.comments.push(c);
      this.newComment = '';
      this.submitting = false;
    });
  }

  startReply(c: Comment): void { this.replyingTo = c; this.replyText = ''; }
  cancelReply(): void { this.replyingTo = null; this.replyText = ''; }

  submitReply(): void {
    const body = this.replyText.trim();
    if (!body || !this.replyingTo || this.replyingSubmitting || !this.item) return;
    this.replyingSubmitting = true;
    this.commentService.addComment(this.item.id, body, this.replyingTo.id).subscribe(c => {
      this.comments.push(c);
      this.replyingTo = null;
      this.replyText = '';
      this.replyingSubmitting = false;
    });
  }

  toggleEmojiPicker(id: string): void {
    this.emojiPickerFor = this.emojiPickerFor === id ? null : id;
  }

  pickEmoji(c: Comment, emoji: string): void {
    if (!this.item) return;
    this.emojiPickerFor = null;
    this.commentService.toggleReaction(this.item.id, c.id, emoji).subscribe(r => c.reactions = r);
  }

  reactionCount(c: Comment, emoji: string): number { return c.reactions[emoji]?.length ?? 0; }
  hasReacted(c: Comment, emoji: string): boolean { return c.reactions[emoji]?.includes(this.currentUserId) ?? false; }
  activeReactions(c: Comment): string[] { return this.EMOJIS.filter(e => (c.reactions[e]?.length ?? 0) > 0); }
  reactionTooltip(c: Comment, emoji: string): string {
    return (c.reactions[emoji] ?? []).map(id => this.userName(id)).join(', ');
  }

  deleteComment(c: Comment): void {
    if (!this.item) return;
    this.commentService.deleteComment(this.item.id, c.id).subscribe(() => {
      this.comments = this.comments.filter(x => x.id !== c.id && x.parent_id !== c.id);
    });
  }

  onDelete(): void {
    if (!this.item) return;
    this.workItemService.delete(this.item.id).subscribe(() => this.router.navigate(['/backlog']));
  }

  closeModal(): void { this.showModal = false; }
}
