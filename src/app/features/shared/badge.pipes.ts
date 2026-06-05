import { Pipe, PipeTransform } from '@angular/core';
import { ItemType, ItemStatus, ItemPriority } from '../../core/models';

@Pipe({ name: 'typeCss', standalone: true })
export class TypeCssPipe implements PipeTransform {
  private map: Record<ItemType, string> = {
    Epic: 'badge-epic',
    Feature: 'badge-feature',
    'User Story': 'badge-story',
    Task: 'badge-task',
  };
  transform(type: ItemType): string {
    return this.map[type] ?? 'badge-task';
  }
}

@Pipe({ name: 'dotCss', standalone: true })
export class DotCssPipe implements PipeTransform {
  private map: Record<ItemType, string> = {
    Epic: 'epic-dot', Feature: 'feature-dot', 'User Story': 'story-dot', Task: 'task-dot',
  };
  transform(type: ItemType): string { return this.map[type] ?? 'task-dot'; }
}

@Pipe({ name: 'statusCss', standalone: true })
export class StatusCssPipe implements PipeTransform {
  private map: Record<ItemStatus, string> = {
    New: 's-new', Active: 's-active', 'In Review': 's-review', Done: 's-done', Blocked: 's-blocked',
  };
  transform(status: ItemStatus): string { return this.map[status] ?? 's-new'; }
}

@Pipe({ name: 'priorityCss', standalone: true })
export class PriorityCssPipe implements PipeTransform {
  private map: Record<ItemPriority, string> = {
    Critical: 'p-critical', High: 'p-high', Medium: 'p-medium', Low: 'p-low',
  };
  transform(priority: ItemPriority): string { return this.map[priority] ?? 'p-medium'; }
}
