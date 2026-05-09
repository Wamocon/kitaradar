interface KitaRadarLogoProps {
  className?: string;
}

export function KitaRadarLogo({ className = "h-8 w-8" }: KitaRadarLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="KitaRadar Logo"
    >
      {/* Radar circles */}
      <circle cx="20" cy="20" r="18" stroke="#2563eb" strokeWidth="2" opacity="0.2" />
      <circle cx="20" cy="20" r="12" stroke="#2563eb" strokeWidth="2" opacity="0.4" />
      <circle cx="20" cy="20" r="6" stroke="#2563eb" strokeWidth="2" opacity="0.7" />

      {/* Map pin */}
      <path
        d="M20 8C16.13 8 13 11.13 13 15C13 20.25 20 28 20 28C20 28 27 20.25 27 15C27 11.13 23.87 8 20 8Z"
        fill="#2563eb"
      />

      {/* House symbol inside pin */}
      <path
        d="M20 11.5L15.5 15.5H16.5V19H19V17H21V19H23.5V15.5H24.5L20 11.5Z"
        fill="white"
        opacity="0.9"
      />
    </svg>
  );
}
