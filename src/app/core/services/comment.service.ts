import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comment } from '../models';

@Injectable({ providedIn: 'root' })
export class CommentService {
  constructor(private http: HttpClient) {}

  getComments(itemId: string): Observable<Comment[]> {
    return this.http.get<Comment[]>(`/api/items/${itemId}/comments`);
  }

  addComment(itemId: string, body: string, parentId: string | null = null): Observable<Comment> {
    return this.http.post<Comment>(`/api/items/${itemId}/comments`, { body, parent_id: parentId });
  }

  toggleReaction(itemId: string, commentId: string, emoji: string): Observable<Record<string, string[]>> {
    return this.http.post<Record<string, string[]>>(
      `/api/items/${itemId}/comments/${commentId}/reactions`, { emoji }
    );
  }
}
