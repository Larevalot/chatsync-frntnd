export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  isOnline: boolean;
}

export type MemberRole = "admin" | "moderator" | "user" | "new" | "banned";

export interface Room {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  inviteCode?: string;
  backgroundUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  owner: Pick<User, "id" | "username">;
  members: RoomMember[];
  joinRequests?: JoinRequest[];
  _count: { messages: number; members: number };
}

export interface RoomMember {
  id: string;
  joinedAt: string;
  role: MemberRole;
  userId: string;
  roomId: string;
  user: Pick<User, "id" | "username" | "avatar" | "isOnline">;
}

export interface JoinRequest {
  id: string;
  status: string;
  createdAt: string;
  userId: string;
  roomId: string;
  user: Pick<User, "id" | "username" | "avatar">;
}

export interface Message {
  id: string;
  content?: string;
  type: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  userId: string;
  roomId: string;
  user: Pick<User, "id" | "username" | "avatar">;
}

export interface TypingData {
  roomId: string;
  users: string[];
}

export interface NotificationData {
  roomId: string;
  message: Message;
}
