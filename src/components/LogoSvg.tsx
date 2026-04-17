interface LogoSvgProps {
  className?: string;
}

export default function LogoSvg({ className }: LogoSvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Traffic Craft logo"
      role="img"
    >
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="10"
        fill="#0e0e12"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1.5"
      />
      <text
        x="6"
        y="28"
        fontFamily="Inter, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#f4f4f5"
      >
        T
      </text>
      <text
        x="19"
        y="28"
        fontFamily="Inter, sans-serif"
        fontWeight="900"
        fontSize="22"
        fill="#0ee0cf"
      >
        C
      </text>
    </svg>
  );
}
