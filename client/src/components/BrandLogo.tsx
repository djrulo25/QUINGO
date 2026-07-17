import { CSSProperties } from 'react'

const logoSource = '/branding/quingo-logo-source-v2.png'

const maskBase: CSSProperties = {
  backgroundColor: 'currentColor',
  maskImage: `url(${logoSource})`,
  maskMode: 'luminance',
  maskRepeat: 'no-repeat',
}

interface BrandLogoProps {
  variant?: 'horizontal' | 'vertical' | 'compact'
  className?: string
}

export default function BrandLogo({ variant = 'horizontal', className = '' }: BrandLogoProps) {
  if (variant === 'compact') {
    return (
      <span
        role="img"
        aria-label="QUINGO"
        className={`block shrink-0 ${className}`}
        style={{
          ...maskBase,
          width: 64,
          height: 52,
          maskSize: '85px 85px',
          maskPosition: '-12px -11px',
        }}
      />
    )
  }

  if (variant === 'vertical') {
    return (
      <span
        role="img"
        aria-label="QUINGO"
        className={`block shrink-0 ${className}`}
        style={{
          ...maskBase,
          width: 120,
          height: 98,
          maskSize: '160px 160px',
          maskPosition: '-22px -21px',
        }}
      />
    )
  }

  return (
    <span role="img" aria-label="QUINGO" className={`inline-flex items-center gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="block shrink-0"
        style={{
          ...maskBase,
          width: 38,
          height: 38,
          maskSize: '102px 102px',
          maskPosition: '-31px -13px',
        }}
      />
      <span
        aria-hidden="true"
        className="block shrink-0"
        style={{
          ...maskBase,
          width: 100,
          height: 20,
          maskSize: '139px 139px',
          maskPosition: '-19px -81px',
        }}
      />
    </span>
  )
}
