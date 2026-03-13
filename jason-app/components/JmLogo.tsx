interface JmLogoProps {
  size?: number
  color?: string
}

export default function JmLogo({ size = 22, color = '#FFD56B' }: JmLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* J — barre du haut + tige + crochet */}
      <path
        d="M6 5h4.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.25 5v13a2.75 2.75 0 01-5.5 0"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* M — deux diagonales avec verticals */}
      <path
        d="M12.5 19V5l4 7 4-7v14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
