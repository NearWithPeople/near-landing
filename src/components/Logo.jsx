export function Logo({ size = 26, className = '', alt = '' }) {
  return <img src="/logo.svg" alt={alt} width={size} height={size} className={className} decoding="async" />
}

