export interface Notification {
  _id: string;
  type: "like" | "comment";
  read: boolean;
  createdAt: string;
  postId: string;
  actorId: { name: string; image: string };
  message?: string;
  link?: string;
}
