export type ItemType = 'Epic' | 'Feature' | 'User Story' | 'Task';
export type ItemStatus = 'New' | 'Active' | 'In Review' | 'Done' | 'Blocked';
export type ItemPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type UserRole = 'admin' | 'user';

export interface WorkItem {
  id: string;
  type: ItemType;
  title: string;
  desc: string;
  status: ItemStatus;
  priority: ItemPriority;
  assignee: string;   // User.id
  points: number;
  due: string;        // ISO date string YYYY-MM-DD
  links: string[];    // WorkItem.id[]
  created: number;    // timestamp
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface Comment {
  id: string;
  item_id: string;
  user_id: string;
  body: string;
  parent_id: string | null;
  created: number;
  reactions: Record<string, string[]>;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: 'mention' | 'item_closed';
  message: string;
  item_id: string | null;
  read: number;
  created: number;
}

export interface NotificationsResponse {
  recent: AppNotification[];
  previous: AppNotification[];
  unread: number;
}

export interface WorkItemFilters {
  search?: string;
  type?: ItemType | '';
  status?: ItemStatus | '';
  priority?: ItemPriority | '';
  assignee?: string;
}
