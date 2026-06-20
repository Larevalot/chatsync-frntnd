import { useState, useRef, useEffect, useCallback } from "react";
import { Room, Message, User, MemberRole, RoomMember } from "../types";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";
import { t } from "../i18n";
import { roomAPI, messageAPI } from "../services/api";
import MessageBubble from "./MessageBubble";
import {
  Send,
  Image,
  X,
  Hash,
  Lock,
  Users,
  Copy,
  Check,
  ImageIcon,
  UserCheck,
  UserX,
  Shield,
  Crown,
  Trash2,
  Ban,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import UserAvatar from "./UserAvatar";
import toast from "react-hot-toast";

const ROLE_COLORS: Record<MemberRole, string> = {
  admin: "bg-yellow-500/20 text-yellow-400",
  moderator: "bg-blue-500/20 text-blue-400",
  user: "bg-green-500/20 text-green-400",
  new: "bg-gray-500/20 text-gray-400",
  banned: "bg-red-500/20 text-red-400",
};

const ROLE_LABELS: Record<MemberRole, string> = {
  admin: "Admin",
  moderator: "Mod",
  user: "User",
  new: "New",
  banned: "Banned",
};

function canSendMedia(role: MemberRole): boolean {
  return ["admin", "moderator", "user"].includes(role);
}

function canModerate(role: MemberRole): boolean {
  return ["admin", "moderator"].includes(role);
}

interface ChatRoomProps {
  room: Room;
  messages: Message[];
  currentUser: User;
  typingUsers: string[];
  onlineUsers: Set<string>;
  loading: boolean;
  onSendMessage: (content: string, file?: File) => void;
  onTyping: (isTyping: boolean) => void;
  onRoomUpdate?: (room: Room) => void;
}

export default function ChatRoom({
  room,
  messages,
  currentUser,
  typingUsers,
  onlineUsers,
  loading,
  onSendMessage,
  onTyping,
  onRoomUpdate,
}: ChatRoomProps) {
  const { theme, lang } = useSettings();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showMembers, setShowMembers] = useState(true);
  const [copied, setCopied] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [roleMenuMember, setRoleMenuMember] = useState<string | null>(null);

  const isDark = theme === "dark";
  const myMember = room.members.find((m) => m.userId === user?.id);
  const myRole = myMember?.role || "user";
  const isOwner = room.ownerId === user?.id;
  const onlineCount = room.members.filter((m) => onlineUsers.has(m.user.id)).length;
  const pendingRequests = room.joinRequests?.filter((r) => r.status === "pending") || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, []);

  const handleTyping = useCallback(() => {
    if (!canSendMedia(myRole) && myRole !== "new") return;
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 2000);
  }, [onTyping, myRole]);

  const handleSend = () => {
    if (!content.trim() && !file) return;
    if (file && !canSendMedia(myRole)) {
      toast.error("Your role does not allow sending media");
      return;
    }
    onSendMessage(content, file || undefined);
    setContent("");
    setFile(null);
    setPreview(null);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!canSendMedia(myRole)) {
      toast.error("Your role does not allow sending media");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      return;
    }
    setFile(selected);
    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("background", selected);
      const res = await roomAPI.updateBackground(room.id, formData);
      onRoomUpdate?.(res.data.room);
      toast.success("Background updated");
    } catch {
      toast.error("Failed to update background");
    } finally {
      setUploadingBg(false);
      if (bgInputRef.current) bgInputRef.current.value = "";
    }
  };

  const handleClearBg = async () => {
    setUploadingBg(true);
    try {
      const formData = new FormData();
      formData.append("clear", "true");
      const res = await roomAPI.updateBackground(room.id, formData);
      onRoomUpdate?.(res.data.room);
      toast.success("Background removed");
    } catch {
      toast.error("Failed to remove background");
    } finally {
      setUploadingBg(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const res = await roomAPI.approveRequest(room.id, requestId);
      onRoomUpdate?.(res.data.room);
      toast.success("Request approved");
    } catch {
      toast.error("Failed to approve request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const res = await roomAPI.rejectRequest(room.id, requestId);
      onRoomUpdate?.(res.data.room);
      toast.success("Request rejected");
    } catch {
      toast.error("Failed to reject request");
    }
  };

  const handleRoleChange = async (memberId: string, role: MemberRole) => {
    try {
      const res = await roomAPI.updateMemberRole(room.id, memberId, role);
      onRoomUpdate?.(res.data.room);
      toast.success("Role updated");
      setRoleMenuMember(null);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await roomAPI.removeMember(room.id, memberId);
      onRoomUpdate?.(res.data.room);
      toast.success("Member removed");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to remove member");
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await messageAPI.delete(room.id, messageId);
      toast.success("Message deleted");
    } catch {
      toast.error("Failed to delete message");
    }
  };

  const typingDisplay =
    typingUsers.length > 0
      ? typingUsers.length === 1
        ? t("someoneTyping", lang)
        : `${typingUsers.length} ${t("peopleTyping", lang)}`
      : null;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className={`flex items-center justify-between px-4 py-2 border-b ${
        isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary-600/20 flex items-center justify-center text-primary-500 shrink-0">
            {room.isPrivate ? <Lock className="w-4 h-4" /> : <Hash className="w-4 h-4" />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-light-900"}`}>{room.name}</h2>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? "bg-dark-700 text-dark-300" : "bg-light-200 text-light-600"}`}>
                {room._count.members}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? "text-dark-400" : "text-light-500"}`}>
              {room._count.members} {t("members", lang).toLowerCase()} · {onlineCount} {t("online", lang).toLowerCase()}
            </p>
          </div>
          {room.inviteCode && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(room.inviteCode!);
                setCopied(true);
                toast.success(t("inviteCode", lang));
                setTimeout(() => setCopied(false), 2000);
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition text-[11px] shrink-0 ${
                isDark
                  ? "bg-dark-800 hover:bg-dark-700 border border-dark-600 text-dark-300"
                  : "bg-light-200 hover:bg-light-300 border border-light-300 text-light-600"
              }`}
              title="Copy invite code"
            >
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              <span className="font-mono">{room.inviteCode}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {canModerate(myRole) && pendingRequests.length > 0 && (
            <button
              onClick={() => setShowRequests(!showRequests)}
              className="relative p-1.5 rounded-md transition bg-primary-600/20 text-primary-400 hover:bg-primary-600/30"
              title="Join requests"
            >
              <UserCheck className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {pendingRequests.length}
              </span>
            </button>
          )}
          {canModerate(myRole) && (
            <>
              <input type="file" ref={bgInputRef} onChange={handleBgUpload} className="hidden" accept="image/*" />
              <button
                onClick={() => bgInputRef.current?.click()}
                disabled={uploadingBg}
                className={`p-1.5 rounded-md transition ${isDark ? "hover:bg-dark-800 text-dark-400" : "hover:bg-light-200 text-light-600"}`}
                title="Change background"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
              {room.backgroundUrl && (
                <button
                  onClick={handleClearBg}
                  disabled={uploadingBg}
                  className={`p-1.5 rounded-md transition ${isDark ? "hover:bg-dark-800 text-dark-400" : "hover:bg-light-200 text-light-600"}`}
                  title="Remove background"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </>
          )}
          <button
            onClick={() => setShowMembers(!showMembers)}
            className={`p-1.5 rounded-md transition ${isDark ? "hover:bg-dark-800 text-dark-400" : "hover:bg-light-200 text-light-600"}`}
          >
            {showMembers ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {showRequests && canModerate(myRole) && pendingRequests.length > 0 && (
        <div className={`px-4 py-2 border-b ${isDark ? "bg-dark-800 border-dark-700" : "bg-light-100 border-light-300"}`}>
          <p className={`text-xs font-semibold mb-2 ${isDark ? "text-dark-300" : "text-light-600"}`}>
            Pending Requests ({pendingRequests.length})
          </p>
          <div className="space-y-1.5">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar username={req.user.username} avatar={req.user.avatar} size="sm" />
                  <span className={`text-sm truncate ${isDark ? "text-white" : "text-light-900"}`}>{req.user.username}</span>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleApproveRequest(req.id)}
                    className="p-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleRejectRequest(req.id)}
                    className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 relative">
          {room.backgroundUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-[0.07] pointer-events-none"
              style={{ backgroundImage: `url(${room.backgroundUrl})`, backgroundAttachment: "fixed" }}
            />
          )}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 relative z-10">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className={isDark ? "text-dark-500" : "text-light-500"}>{t("noMessages", lang)}</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const prev = messages[i - 1];
                const showHeader = !prev || prev.userId !== msg.userId;
                const msgMember = room.members.find((m) => m.userId === msg.userId);
                const canDelete = msg.userId === currentUser.id || canModerate(myRole);
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isOwn={msg.userId === currentUser.id}
                    showHeader={showHeader}
                    memberRole={msgMember?.role}
                    canDelete={canDelete}
                    onDelete={canDelete ? () => handleDeleteMessage(msg.id) : undefined}
                  />
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {typingDisplay && (
            <div className="px-4 py-0.5 relative z-10">
              <p className={`text-xs italic flex items-center gap-1 ${isDark ? "text-dark-400" : "text-light-500"}`}>
                <span className="flex gap-0.5">
                  <span className="w-1 h-1 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1 h-1 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1 h-1 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
                {typingDisplay}
              </p>
            </div>
          )}

          {file && (
            <div className="px-4 py-1 relative z-10">
              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg border text-xs ${
                isDark ? "bg-dark-800/80 border-dark-600" : "bg-light-100 border-light-300"
              }`}>
                {preview ? (
                  <img src={preview} alt="Preview" className="w-8 h-8 object-cover rounded" />
                ) : (
                  <span className={isDark ? "text-dark-400" : "text-light-500"}>📎</span>
                )}
                <span className={`truncate max-w-[120px] ${isDark ? "text-dark-300" : "text-light-600"}`}>{file.name}</span>
                <button onClick={() => { setFile(null); setPreview(null); }} className="hover:opacity-70">
                  <X className={`w-3 h-3 ${isDark ? "text-dark-400" : "text-light-500"}`} />
                </button>
              </div>
            </div>
          )}

          <div className="px-3 py-2 flex items-center gap-2 relative z-10">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.zip" />
            {canSendMedia(myRole) && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-lg transition ${isDark ? "text-dark-400 hover:text-dark-200 hover:bg-dark-800/50" : "text-light-500 hover:text-light-700 hover:bg-light-200/50"}`}
              >
                <Image className="w-4 h-4" />
              </button>
            )}
            <input
              type="text"
              value={content}
              onChange={(e) => { setContent(e.target.value); handleTyping(); }}
              onKeyDown={handleKeyDown}
              placeholder={t("typeMessage", lang)}
              className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500 transition ${
                isDark
                  ? "bg-dark-800/60 border border-dark-700/50 text-white placeholder:text-dark-500"
                  : "bg-light-100/60 border border-light-300/50 text-light-900 placeholder:text-light-500"
              }`}
            />
            <button
              onClick={handleSend}
              disabled={!content.trim() && !file}
              className="p-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showMembers && (
          <aside className={`w-60 border-l overflow-y-auto hidden lg:block ${
            isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
          }`}>
            <div className="p-3">
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? "text-dark-400" : "text-light-500"}`}>
                {t("members", lang)} — {room._count.members} · {onlineCount} online
              </h3>
              <div className="space-y-0.5">
                {room.members.map((member) => (
                  <div key={member.id} className="relative">
                    <div
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${isDark ? "hover:bg-dark-800" : "hover:bg-light-100"}`}
                    >
                      <UserAvatar
                        username={member.user.username}
                        avatar={member.user.avatar}
                        isOnline={onlineUsers.has(member.user.id)}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className={`text-xs truncate ${isDark ? "text-white" : "text-light-900"}`}>
                            {member.user.username}
                          </p>
                          <span className={`text-[9px] px-1 py-0.5 rounded ${ROLE_COLORS[member.role]}`}>
                            {ROLE_LABELS[member.role]}
                          </span>
                        </div>
                      </div>
                      {canModerate(myRole) && member.role !== "admin" && member.userId !== currentUser.id && (
                        <div className="flex gap-0.5 shrink-0">
                          <button
                            onClick={() => setRoleMenuMember(roleMenuMember === member.id ? null : member.id)}
                            className={`p-1 rounded transition ${isDark ? "hover:bg-dark-700 text-dark-400" : "hover:bg-light-200 text-light-500"}`}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    {roleMenuMember === member.id && (
                      <div className={`ml-8 mb-1 p-1.5 rounded-lg border ${isDark ? "bg-dark-800 border-dark-600" : "bg-light-100 border-light-300"}`}>
                        {(["moderator", "user", "new", "banned"] as MemberRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleChange(member.id, r)}
                            className={`w-full text-left px-2 py-1 text-xs rounded transition ${
                              member.role === r
                                ? "bg-primary-600/20 text-primary-400"
                                : isDark ? "hover:bg-dark-700 text-dark-300" : "hover:bg-light-200 text-light-700"
                            }`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="w-full text-left px-2 py-1 text-xs rounded transition text-red-400 hover:bg-red-500/10 mt-1 border-t border-dark-600 pt-1.5"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
