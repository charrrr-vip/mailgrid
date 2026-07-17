"use client";

import { Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { getInitials } from "@/lib/utils/getInitials";

interface CustomAvatarProps {
  src?: string;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 64,
  xl: 96,
};

const colors = [
  "#1E3A8A",
  "#1E3A8A",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
];

function getColorFromName(name: string): string {
  const charCode = name.charCodeAt(0);
  return colors[charCode % colors.length];
}

export function CustomAvatar({
  src,
  name,
  size = "md",
  className = "",
}: CustomAvatarProps) {
  const avatarSize = sizeMap[size];

  if (src) {
    return (
      <Avatar
        src={src}
        size={avatarSize}
        className={`border-2 border-white shadow-sm ${className}`}
      />
    );
  }

  if (name) {
    const initials = getInitials(name);
    const bgColor = getColorFromName(name);

    return (
      <Avatar
        size={avatarSize}
        style={{
          backgroundColor: bgColor,
          fontSize: avatarSize * 0.4,
          fontWeight: 600,
        }}
        className={`border-2 border-white shadow-sm ${className}`}
      >
        {initials}
      </Avatar>
    );
  }

  return (
    <Avatar
      size={avatarSize}
      icon={<UserOutlined />}
      className={`bg-gray-300 ${className}`}
    />
  );
}
