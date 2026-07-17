import type { SVGProps } from "react";

export type IconName =
  | "home"
  | "tasks"
  | "progress"
  | "materials"
  | "profile"
  | "search"
  | "chevron-right"
  | "chevron-left"
  | "plus"
  | "bell"
  | "moon"
  | "target"
  | "check"
  | "star"
  | "star-fill"
  | "flame"
  | "calendar"
  | "trophy"
  | "book"
  | "cards"
  | "refresh"
  | "logout"
  | "trash"
  | "lock"
  | "close"
  | "clock"
  | "spark";

const PATHS: Record<IconName, string> = {
  home: "M4 11 12 4l8 7M6 10v10h12V10",
  tasks: "M8 6h11M8 12h11M8 18h11M4 6h.01M4 12h.01M4 18h.01",
  progress: "M5 20V11M12 20V4M19 20v-6",
  materials:
    "M5 5.5A1.5 1.5 0 0 1 6.5 4H18v16H6.5A1.5 1.5 0 0 1 5 18.5ZM5 16.5A1.5 1.5 0 0 1 6.5 15H18",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 20c1.2-3.2 4-5 7-5s5.8 1.8 7 5",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.2-3.2",
  "chevron-right": "m9 6 6 6-6 6",
  "chevron-left": "M15 5l-7 7 7 7",
  plus: "M12 5v14M5 12h14",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  moon: "M12 3a9 9 0 1 0 9 9c-5 0-9-4-9-9Z",
  target: "M12 2v4M5 8l6 4 6-4M5 8v8l7 4 7-4V8M5 8l7-4 7 4",
  check: "M5 12l4 4 10-10",
  star: "m12 4 2.5 5.2 5.5.8-4 3.9.9 5.6L12 17l-4.8 2.5.9-5.6-4-3.9 5.5-.8Z",
  "star-fill": "m12 4 2.5 5.2 5.5.8-4 3.9.9 5.6L12 17l-4.8 2.5.9-5.6-4-3.9 5.5-.8Z",
  flame: "M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.7-2.5 1.3-3.2C10 9 10 6 12 3Z",
  calendar: "M7 3v3M17 3v3M4 8h16M5 6h14v14H5zM8 12h3M8 16h8",
  trophy: "M7 4h10v4a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 19h6M12 14v5",
  book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H19v14H5.5A1.5 1.5 0 0 0 4 19.5ZM4 5.5V19.5",
  cards: "M8 7l8-2 2 8-8 2ZM6 9l1.5 8 8-1.5",
  refresh: "M4 12a8 8 0 0 1 13.7-5.6L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.7 5.6L4 16M4 20v-4h4",
  logout: "M15 12H4M11 8l-4 4 4 4M9 4h9v16H9",
  trash: "M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13",
  lock: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5zM12 15v3",
  close: "M6 6l12 12M18 6 6 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
  spark: "M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18",
};

export function Icon({
  name,
  size = 24,
  ...rest
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  const filled = name === "star-fill";
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
