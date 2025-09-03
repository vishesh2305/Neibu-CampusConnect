export type NotificationType = "like" | "comment" | "follow" | "message";

export interface Notification {
  _id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  postId?: string; // only relevant for like/comment
  actorId: {
    _id: string;
    name: string;
    image?: string;
  };
  message?: string;
  link?: string;
}
