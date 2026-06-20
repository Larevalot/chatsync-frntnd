import { useState } from "react";
import { Message, MemberRole } from "../types";
import { useSettings } from "../context/SettingsContext";
import UserAvatar from "./UserAvatar";
import { File, Download, Trash2 } from "lucide-react";

const ROLE_BADGES: Record<MemberRole, { label: string; color: string }> = {
  admin: { label: "A", color: "bg-yellow-500 text-yellow-900" },
  moderator: { label: "M", color: "bg-blue-500 text-blue-900" },
  user: { label: "", color: "" },
  new: { label: "N", color: "bg-gray-500 text-gray-900" },
  banned: { label: "B", color: "bg-red-500 text-red-900" },
};

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
  memberRole?: MemberRole;
  canDelete?: boolean;
  onDelete?: () => void;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({
  message,
  isOwn,
  showHeader,
  memberRole,
  canDelete,
  onDelete,
}: MessageBubbleProps) {
  const { theme } = useSettings();
  const isDark = theme === "dark";
  const [hovered, setHovered] = useState(false);
  const badge = memberRole ? ROLE_BADGES[memberRole] : null;

  return (
    <div
      className={`flex gap-2.5 ${showHeader ? "mt-3" : "mt-0.5"} ${isOwn ? "flex-row-reverse" : ""}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="w-7 shrink-0">
        {showHeader && (
          <UserAvatar username={message.user.username} avatar={message.user.avatar} size="sm" />
        )}
      </div>

      <div className={`max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col relative group`}>
        {showHeader && (
          <div className={`flex items-center gap-1.5 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
            <span className={`text-xs font-medium ${isDark ? "text-dark-200" : "text-light-800"}`}>
              {isOwn ? "You" : message.user.username}
            </span>
            {badge && badge.label && (
              <span className={`text-[8px] font-bold px-1 py-0 rounded ${badge.color}`}>
                {badge.label}
              </span>
            )}
            <span className={`text-[10px] ${isDark ? "text-dark-500" : "text-light-500"}`}>
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        <div className="relative">
          <div
            className={`px-3 py-1.5 rounded-2xl max-w-full break-words text-sm ${
              isOwn
                ? "bg-primary-600 text-white rounded-tr-md"
                : isDark
                  ? "bg-dark-800 text-dark-100 rounded-tl-md"
                  : "bg-light-200 text-light-900 rounded-tl-md"
            }`}
          >
            {message.type === "image" && message.fileUrl && (
              <div className="mb-1.5">
                <img
                  src={message.fileUrl}
                  alt="Shared"
                  className="max-w-xs max-h-48 rounded-lg object-cover cursor-pointer"
                  onClick={() => window.open(message.fileUrl, "_blank")}
                />
              </div>
            )}

            {message.type === "file" && message.fileUrl && (
              <div className="mb-1.5">
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition text-xs ${
                    isOwn
                      ? "bg-primary-700 hover:bg-primary-800"
                      : isDark
                        ? "bg-dark-700 hover:bg-dark-600"
                        : "bg-light-300 hover:bg-light-400"
                  }`}
                >
                  <File className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{message.fileName || "File"}</span>
                  <Download className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            {message.content && (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>

          {canDelete && hovered && onDelete && (
            <button
              onClick={onDelete}
              className={`absolute ${isOwn ? "-left-7" : "-right-7"} top-1/2 -translate-y-1/2 p-1 rounded-md transition opacity-0 group-hover:opacity-100 ${
                isDark ? "hover:bg-dark-700 text-dark-400 hover:text-red-400" : "hover:bg-light-300 text-light-500 hover:text-red-500"
              }`}
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
