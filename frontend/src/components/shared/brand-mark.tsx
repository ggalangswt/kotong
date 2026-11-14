// Keep in sync with src/app/icon.svg (the favicon uses the same artwork).
export function BrandMark({ size = 35 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="15" fill="#18542a" />
      <path
        d="M19 27h8v9.5L38 27h10.5L34.5 39 49 51H38.5L27 41.5V51h-8z"
        fill="#f7f6ee"
        stroke="#f7f6ee"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M18.5 12.5h27a3 3 0 0 1 2.7 1.7l4.3 8.8v1a5 5 0 0 1-10 0 5 5 0 0 1-10 0 5 5 0 0 1-10 0 5 5 0 0 1-10 0v-1l4.3-8.8a3 3 0 0 1 2.7-1.7z"
        fill="#f3d63b"
        stroke="#18542a"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
