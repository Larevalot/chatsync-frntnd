import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { useSettings } from "../context/SettingsContext";
import { t } from "../i18n";
import { roomAPI, messageAPI } from "../services/api";
import { Room, Message, TypingData } from "../types";
import Sidebar from "../components/Sidebar";
import ChatRoom from "../components/ChatRoom";
import CreateRoomModal from "../components/CreateRoomModal";
import ProfileSettings from "../components/ProfileSettings";
import SettingsToggle from "../components/SettingsToggle";
import toast from "react-hot-toast";
import { Menu } from "lucide-react";

export default function ChatPage() {
  const { user, logout } = useAuth();
  const { socket, emit, on, off } = useSocket();
  const { theme, lang } = useSettings();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem("chatsync_sidebar_width");
    return stored ? parseInt(stored, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const isDark = theme === "dark";

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(240, Math.min(480, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      localStorage.setItem("chatsync_sidebar_width", String(sidebarWidth));
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await roomAPI.list();
      setRooms(res.data.rooms);
    } catch {
      toast.error(t("failedLoadRooms", lang));
    }
  }, [lang]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (msg: Message) => {
      if (msg.roomId === activeRoom?.id) {
        setMessages((prev) => [...prev, msg]);
      }
      setRooms((prev) =>
        prev.map((r) =>
          r.id === msg.roomId
            ? { ...r, _count: { ...r._count, messages: r._count.messages + 1 } }
            : r
        )
      );
    };

    const handleTypingUpdate = (data: TypingData) => {
      setTypingUsers((prev) => ({ ...prev, [data.roomId]: data.users }));
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(userId));
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleNotification = (data: { roomId: string; message: Message }) => {
      if (data.roomId !== activeRoom?.id) {
        toast(t("newMessageNotif", lang), { icon: "💬" });
      }
    };

    on("message:new", handleNewMessage);
    on("typing:update", handleTypingUpdate);
    on("user:online", handleUserOnline);
    on("user:offline", handleUserOffline);
    on("notification:new", handleNotification);

    return () => {
      off("message:new", handleNewMessage);
      off("typing:update", handleTypingUpdate);
      off("user:online", handleUserOnline);
      off("user:offline", handleUserOffline);
      off("notification:new", handleNotification);
    };
  }, [socket, activeRoom, on, off, lang]);

  useEffect(() => {
    if (!socket) return;
    const members = rooms.flatMap((r) => r.members.map((m) => m.user));
    const online = new Set(
      members.filter((u) => u.isOnline).map((u) => u.id)
    );
    setOnlineUsers(online);
  }, [rooms, socket]);

  const selectRoom = useCallback(
    async (room: Room) => {
      if (activeRoom) {
        emit("room:leave", activeRoom.id);
      }
      setActiveRoom(room);
      setSidebarOpen(false);
      setLoadingMessages(true);

      try {
        const res = await messageAPI.list(room.id);
        setMessages(res.data.messages);
        emit("room:join", room.id);
      } catch {
        toast.error(t("failedLoadMessages", lang));
      } finally {
        setLoadingMessages(false);
      }
    },
    [activeRoom, emit, lang]
  );

  const sendMessage = useCallback(
    async (content: string, file?: File) => {
      if (!activeRoom) return;

      try {
        const formData = new FormData();
        if (content) formData.append("content", content);
        if (file) formData.append("file", file);

        const res = await messageAPI.send(activeRoom.id, formData);
        const msg = res.data.message;
        setMessages((prev) => [...prev, msg]);
        emit("message:send", { roomId: activeRoom.id, message: msg });
      } catch {
        toast.error(t("failedSend", lang));
      }
    },
    [activeRoom, emit, lang]
  );

  const handleCreateRoom = useCallback(
    async (data: { name: string; description?: string; isPrivate?: boolean }) => {
      try {
        const res = await roomAPI.create(data);
        setRooms((prev) => [res.data.room, ...prev]);
        setShowCreateModal(false);
        selectRoom(res.data.room);
        toast.success(t("roomCreated", lang));
      } catch {
        toast.error(t("failedCreateRoom", lang));
      }
    },
    [selectRoom, lang]
  );

  const handleJoinRoom = useCallback(
    async (roomId: string, inviteCode?: string) => {
      try {
        const res = await roomAPI.join(roomId, inviteCode);
        if (res.data.pending) {
          toast.success(res.data.message || "Join request sent");
          return;
        }
        setRooms((prev) => {
          const exists = prev.find((r) => r.id === roomId);
          if (exists) return prev.map((r) => (r.id === roomId ? res.data.room : r));
          return [res.data.room, ...prev];
        });
        selectRoom(res.data.room);
        toast.success(t("joinedRoom", lang));
      } catch (err: any) {
        toast.error(err.response?.data?.error || t("failedJoin", lang));
      }
    },
    [selectRoom, lang]
  );

  return (
    <div className={`h-screen flex overflow-hidden ${isDark ? "bg-dark-950" : "bg-light-100"}`}>
      <div
        className={`fixed inset-0 z-40 bg-black/50 lg:hidden transition-opacity ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        ref={sidebarRef}
        style={{ width: sidebarWidth }}
        className={`fixed lg:static inset-y-0 left-0 z-50 border-r transform transition-transform lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } ${isResizing ? "select-none" : ""} ${
          isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
        }`}
      >
        <Sidebar
          rooms={rooms}
          activeRoom={activeRoom}
          currentUser={user!}
          onlineUsers={onlineUsers}
          onSelectRoom={selectRoom}
          onCreateRoom={() => setShowCreateModal(true)}
          onJoinRoom={handleJoinRoom}
          onLogout={logout}
          onClose={() => setSidebarOpen(false)}
          onProfile={() => setShowProfileModal(true)}
        />
        <div
          onMouseDown={handleResizeStart}
          className={`hidden lg:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize group transition-colors ${
            isResizing ? "bg-primary-500" : "bg-transparent hover:bg-primary-500/30"
          }`}
        >
          <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-0.5 h-8 rounded-full transition ${
            isResizing ? "bg-primary-400" : isDark ? "bg-dark-500 group-hover:bg-primary-400" : "bg-light-400 group-hover:bg-primary-400"
          }`} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className={`flex items-center justify-between px-4 py-3 border-b lg:hidden ${
          isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
        }`}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className={`p-2 rounded-lg transition ${isDark ? "hover:bg-dark-800" : "hover:bg-light-200"}`}
            >
              <Menu className={`w-5 h-5 ${isDark ? "text-dark-300" : "text-light-600"}`} />
            </button>
            {activeRoom && (
              <h2 className={`font-semibold truncate ${isDark ? "text-white" : "text-light-900"}`}>{activeRoom.name}</h2>
            )}
          </div>
          <SettingsToggle />
        </header>

        <div className={`hidden lg:flex items-center justify-end px-4 py-2 border-b ${
          isDark ? "bg-dark-900 border-dark-700" : "bg-white border-light-300"
        }`}>
          <SettingsToggle />
        </div>

        {activeRoom ? (
          <ChatRoom
            room={activeRoom}
            messages={messages}
            currentUser={user!}
            typingUsers={typingUsers[activeRoom.id] || []}
            onlineUsers={onlineUsers}
            loading={loadingMessages}
            onSendMessage={sendMessage}
            onTyping={(typing) =>
              emit(typing ? "typing:start" : "typing:stop", activeRoom.id)
            }
            onRoomUpdate={(updatedRoom) => {
              setActiveRoom(updatedRoom);
              setRooms((prev) =>
                prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r))
              );
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                isDark ? "bg-dark-800" : "bg-light-200"
              }`}>
                <span className="text-4xl">💬</span>
              </div>
              <h2 className={`text-xl font-semibold mb-2 ${isDark ? "text-white" : "text-light-900"}`}>
                {t("welcomeChat", lang)}
              </h2>
              <p className={isDark ? "text-dark-400" : "text-light-500"}>
                {t("selectRoom", lang)}
              </p>
            </div>
          </div>
        )}
      </main>

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateRoom}
        />
      )}

      {showProfileModal && (
        <ProfileSettings
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
