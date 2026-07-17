/**
 * Единый монохромный набор иконок предметов.
 * viewBox 0 0 64 64, штрих через currentColor — цвет задаётся родителем
 * (.subj-tile красит штрих в --ink-2, .is-active — в --accent).
 */
export const SUBJECT_ICON_PATHS: Record<string, string> = {
  russian: "m22 42 3.5-10.5L40 17l7 7-14.5 14.5L22 42ZM35.5 21.5l7 7M22 46h25",
  math: "M22 43 42 21M23 21h18v22H23zM27 27h10M27 32h10M27 37h5",
  "basic-math": "M21 24h22M21 32h22M21 40h22M25 21v6M39 29v6",
  history:
    "m18 26 14-8 14 8H18ZM21 30h22M24 30v13M32 30v13M40 30v13M20 43h24M17 47h30",
  english:
    "m18 44 8-24 8 24M21 36h10M38 31.5c1.5-1.3 3.1-2 4.8-2 3.4 0 5.2 2 5.2 5v9.5M48 36.5h-4.8c-3.6 0-5.2 1.3-5.2 3.8 0 2.3 1.7 3.7 4.3 3.7 2.2 0 4.1-1.1 5.7-3.2",
  biology:
    "M45 20c-13 .3-22 7.2-22 17.2 0 5.1 3.8 8.8 8.7 8.8C42 46 45.5 34 45 20ZM21 46c4.5-8.5 10-13.8 18-18",
  chemistry:
    "M27 20h10M29 20v10L21 44a3 3 0 0 0 2.6 4.5h16.8A3 3 0 0 0 43 44l-8-14V20M25 40h14",
  informatics: "m27 24-8 8 8 8M37 24l8 8-8 8M35 20l-6 24",
  social: "M32 18v28M22 22h20M24 22l-7 13h14l-7-13ZM40 22l-7 13h14l-7-13ZM25 46h14",
  literature:
    "M32 23c-4.2-4-9.2-5.2-15-3.7v25c5.8-1.5 10.8-.3 15 3.7M32 23c4.2-4 9.2-5.2 15-3.7v25c-5.8-1.5-10.8-.3-15 3.7V23Z",
  geography:
    "M15 32h34M32 15c5 4.7 7.5 10.4 7.5 17S37 44.3 32 49c-5-4.7-7.5-10.4-7.5-17S27 19.7 32 15Z",
};

export function SubjectGlyph({ icon }: { icon: string }) {
  const d = SUBJECT_ICON_PATHS[icon] ?? SUBJECT_ICON_PATHS["basic-math"];
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/** Плитка иконки предмета из дизайн-системы (.subj-tile). */
export function SubjectTile({
  icon,
  active = false,
  size,
}: {
  icon: string;
  active?: boolean;
  size?: number;
}) {
  const style = size
    ? { width: size, height: size }
    : undefined;
  return (
    <span className={"subj-tile" + (active ? " is-active" : "")} style={style}>
      <SubjectGlyph icon={icon} />
    </span>
  );
}
