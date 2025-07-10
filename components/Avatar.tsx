import React, { useState } from "react";

type AvatarProps = {
  name: string;
  photoUrl?: string;
  size?: number; // default 60 recommended for consistent UI
};

function getInitials(name: string) {
  const names = name.trim().split(" ");
  if (names.length === 0) return "";
  if (names.length === 1) return names[0][0].toUpperCase();
  return (names[0][0] + names[1][0]).toUpperCase();
}

export default function Avatar({ name, photoUrl, size = 60 }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);

  const commonStyles: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flexShrink: 0, // Prevent shrinking inside flex containers
  };

  const initialsStyles: React.CSSProperties = {
    ...commonStyles,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: size / 2,
    fontWeight: "bold",
    color: "white",               // letters in white
    backgroundColor: "#1D4ED8",   // blue background (Tailwind blue-700)
    userSelect: "none",
    overflow: "hidden",
  };

  const imgStyles: React.CSSProperties = {
    ...commonStyles,
    objectFit: "cover",
    display: "block",
  };

  if (!photoUrl || photoUrl.trim() === "" || imgError) {
    return (
      <div style={initialsStyles} aria-label={`Avatar initials for ${name}`}>
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      style={imgStyles}
      onError={() => setImgError(true)}
      aria-label={`Avatar image for ${name}`}
    />
  );
}
