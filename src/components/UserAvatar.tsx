interface UserAvatarProps {
  username: string;
  avatar?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const colors = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-green-600",
  "bg-orange-600",
  "bg-pink-600",
  "bg-cyan-600",
  "bg-red-600",
  "bg-yellow-600",
];

function getColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function UserAvatar({
  username,
  avatar,
  isOnline,
  size = "md",
}: UserAvatarProps) {
  const initial = username.charAt(0).toUpperCase();
  const colorClass = getColor(username);

  return (
    <div className="relative shrink-0">
      {avatar ? (
        <img
          src={avatar}
          alt={username}
          className={`${sizes[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${sizes[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-semibold`}
        >
          {initial}
        </div>
      )}
      {isOnline !== undefined && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-dark-900 ${
            isOnline ? "bg-green-500" : "bg-dark-500"
          }`}
        />
      )}
    </div>
  );
}
