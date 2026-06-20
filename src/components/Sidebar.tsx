import { useState } from "react";
import { Room, User } from "../types";
import { useSettings } from "../context/SettingsContext";
import { t } from "../i18n";
import {
  Plus,
  Search,
  LogOut,
  Hash,
  Lock,
  Users,
  X,
  Link2,
  Settings,
} from "lucide-react";
import UserAvatar from "./UserAvatar";

import { roomAPI } from "../services/api";
import toast from "react-hot-toast";

interface SidebarProps {
  rooms: Room[];
  activeRoom: Room | null;
  currentUser: User;
  onlineUsers: Set<string>;
  onSelectRoom: (room: Room) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, inviteCode?: string) => void;
  onLogout: () => void;
  onClose: () => void;
  onProfile: () => void;
}

export default function Sidebar({
  rooms,
  activeRoom,
  currentUser,
  onlineUsers,
  onSelectRoom,
  onCreateRoom,
  onJoinRoom,
  onLogout,
  onClose,
  onProfile,
}: SidebarProps) {
  const { theme, lang } = useSettings();
  const [search, setSearch] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const isDark = theme === "dark";

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    const code = joinCode.trim();
    setJoinCode("");
    setShowJoin(false);

    const existingRoom = rooms.find((r) => r.id === code || r.inviteCode === code);
    if (existingRoom) {
      onJoinRoom(existingRoom.id, existingRoom.inviteCode);
      return;
    }

    try {
      const res = await roomAPI.getByCode(code);
      const found = res.data.rooms?.[0];
      if (found) {
        onJoinRoom(found.id, found.inviteCode || code);
      } else {
        onJoinRoom(code);
      }
    } catch {
      onJoinRoom(code);
    }
  };

  const searchIsCode = search.length >= 6 && !search.includes(" ");
  const displayRooms = searchIsCode
    ? rooms.filter((r) => r.inviteCode?.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase()))
    : rooms.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col h-full">
      <div className={`p-4 border-b ${isDark ? "border-dark-700" : "border-light-300"}`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-xl font-bold flex items-center gap-2 ${isDark ? "text-white" : "text-light-900"}`}>
            <span className="text-primary-500">⚡</span> ChatSync
          </h1>
          <button
            onClick={onClose}
            className={`lg:hidden p-1 rounded ${isDark ? "hover:bg-dark-800" : "hover:bg-light-200"}`}
          >
            <X className={`w-5 h-5 ${isDark ? "text-dark-400" : "text-light-500"}`} />
          </button>
        </div>

        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? "text-dark-400" : "text-light-500"}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchRooms", lang)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition ${
              isDark
                ? "bg-dark-800 border border-dark-600 text-white"
                : "bg-light-100 border border-light-300 text-light-900"
            }`}
          />
        </div>
      </div>

      <div className="p-3 flex gap-2">
        <button
          onClick={onCreateRoom}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-medium transition"
        >
          <Plus className="w-4 h-4" />
          {t("newRoom", lang)}
        </button>
        <button
          onClick={() => setShowJoin(!showJoin)}
          className={`px-3 py-2.5 rounded-xl transition ${
            isDark
              ? "bg-dark-800 hover:bg-dark-700 text-dark-300"
              : "bg-light-200 hover:bg-light-300 text-light-600"
          }`}
          title="Join with code"
        >
          <Link2 className="w-4 h-4" />
        </button>
      </div>

      {showJoin && (
        <div className="px-3 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Room ID or invite code"
              className={`flex-1 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary-500 ${
                isDark
                  ? "bg-dark-800 border border-dark-600 text-white"
                  : "bg-light-100 border border-light-300 text-light-900"
              }`}
            />
            <button
              onClick={handleJoin}
              className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition"
            >
              Join
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-1">
          {displayRooms.map((room) => {
            const isActive = activeRoom?.id === room.id;
            return (
              <button
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`w-full text-left px-3 py-3 rounded-xl transition group ${
                  isActive
                    ? "bg-primary-600/20 border border-primary-500/30"
                    : `border border-transparent ${isDark ? "hover:bg-dark-800" : "hover:bg-light-200"}`
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : isDark
                          ? "bg-dark-700 text-dark-400"
                          : "bg-light-200 text-light-500"
                    }`}
                  >
                    {room.isPrivate ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <Hash className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-medium truncate ${
                        isActive
                          ? "text-white"
                          : isDark
                            ? "text-dark-200"
                            : "text-light-800"
                      }`}
                    >
                      {room.name}
                    </p>
                    <p className={`text-xs truncate flex items-center gap-1 ${isDark ? "text-dark-400" : "text-light-500"}`}>
                      <Users className="w-3 h-3" />
                      {room._count.members} {t("members", lang).toLowerCase()}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}

          {displayRooms.length === 0 && (
            <p className={`text-center text-sm py-8 ${isDark ? "text-dark-500" : "text-light-500"}`}>
              {search ? t("noRoomsFound", lang) : t("noRooms", lang)}
            </p>
          )}
        </div>
      </div>

      <div className={`p-4 border-t ${isDark ? "border-dark-700" : "border-light-300"}`}>
        <div className="flex items-center gap-3">
          <UserAvatar
            username={currentUser.username}
            avatar={currentUser.avatar}
            isOnline={true}
          />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isDark ? "text-white" : "text-light-900"}`}>
              {currentUser.username}
            </p>
            <p className="text-xs text-green-500">{t("online", lang)}</p>
          </div>
          <button
            onClick={onProfile}
            className={`p-2 rounded-lg transition ${isDark ? "hover:bg-dark-800 text-dark-400 hover:text-primary-400" : "hover:bg-light-200 text-light-500 hover:text-primary-600"}`}
            title={t("profileSettings", lang)}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={onLogout}
            className={`p-2 rounded-lg transition ${isDark ? "hover:bg-dark-800 text-dark-400 hover:text-red-400" : "hover:bg-light-200 text-light-500 hover:text-red-500"}`}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
