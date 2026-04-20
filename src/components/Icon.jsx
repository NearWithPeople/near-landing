import mapPinSvg from '../assets/icons/map-pin.svg?raw'
import briefcaseSvg from '../assets/icons/briefcase.svg?raw'
import searchSvg from '../assets/icons/search.svg?raw'
import sparkSvg from '../assets/icons/spark.svg?raw'
import telegramSvg from '../assets/icons/telegram.svg?raw'
import instagramSvg from '../assets/icons/instagram.svg?raw'
import userSvg from '../assets/icons/user.svg?raw'

const ICONS = {
  mapPin: mapPinSvg,
  briefcase: briefcaseSvg,
  search: searchSvg,
  spark: sparkSvg,
  telegram: telegramSvg,
  instagram: instagramSvg,
  user: userSvg,
}

export function Icon({ name, title, className = '' }) {
  const svg = ICONS[name]
  if (!svg) return null
  return (
    <span
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      aria-hidden={title ? undefined : true}
      // Local assets only
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

