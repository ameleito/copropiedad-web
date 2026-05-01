export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  payload: string | null;
  channel: string;
  read: boolean;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}
