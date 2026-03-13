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
      {/* Small circle at apex between the two arch peaks */}
      <circle cx="12" cy="4.5" r="1.8" fill={color} />
      {/* J hook → left diagonal leg → left inner arch → valley → right inner arch → right diagonal leg */}
      <path
        d="M 9.5,19.5 C 10,23.5 3.5,24 3.5,19 L 8.5,7 Q 10.5,15.5 12,14 Q 13.5,15.5 15.5,7 L 20.5,19"
        stroke={color}
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
