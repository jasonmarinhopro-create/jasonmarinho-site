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
      <path
        d="M 9,17 C 10,21.5 2.5,22 2.5,16 L 2.5,10 Q 2.5,1.5 8,1.5 Q 10.5,1.5 12,7 Q 13.5,1.5 16,1.5 Q 21.5,1.5 21.5,10 L 21.5,18.5"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
