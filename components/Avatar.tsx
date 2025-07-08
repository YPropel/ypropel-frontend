import React, { useState } from "react";

type AvatarProps = {
  name: string;
  photoUrl?: string;
  size?: number; // optional size in pixels, default is 32
};

function getInitials(name: string) {
  const names = name.trim().split(" ");
  if (names.length === 0) return "";
  if (names.length === 1) return names[0][0].toUpperCase();
  return (names[0][0] + names[1][0]).toUpperCase();
}

export default function Avatar({ name, photoUrl, size = 32 }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  const style = {
    width: size,
    height: size,
    lineHeight: `${size}px`,
    fontSize: size / 2,
  };

  if (!photoUrl || photoUrl.trim() === "" || imgError) {
    return (
      <div
        style={style}
        className="rounded-full bg-gray-400 text-white font-semibold text-center select-none"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      style={style}
      className="rounded-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}
