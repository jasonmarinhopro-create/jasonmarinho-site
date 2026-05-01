import Image from 'next/image'

interface JmLogoProps {
  size?: number
  color?: string // kept for API compatibility but unused, logo uses its own colors
}

export default function JmLogo({ size = 22 }: JmLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Jason Marinho"
      width={size}
      height={size}
      style={{ objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }}
    />
  )
}
