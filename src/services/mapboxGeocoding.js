import { BELARUS_CITY_OPTIONS } from '../constants/belarusCities'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const BELARUS_CITY_LABELS = BELARUS_CITY_OPTIONS.filter((city) => city.value !== 'all').map((city) => city.label)

function getFeatureCityName(feature) {
  const contextItems = [feature, ...(feature.context || [])]
  for (const item of contextItems) {
    const text = item?.text_ru || item?.text || ''
    if (BELARUS_CITY_LABELS.includes(text)) return text
  }

  const placeName = feature.place_name_ru || feature.place_name || ''
  return BELARUS_CITY_LABELS.find((label) => placeName.includes(label)) || ''
}

function getAddressLine(feature, cityName) {
  const placeName = feature.place_name_ru || feature.place_name || ''
  const primary = feature.text_ru || feature.text || ''

  if (cityName && placeName.startsWith(cityName)) {
    return placeName
      .slice(cityName.length)
      .replace(/^,\s*/, '')
      .split(', Беларусь')[0]
      .trim()
  }

  return primary.trim()
}
//

async function fetchMapboxGeocoding(url) {
  if (!MAPBOX_TOKEN) return []

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Не удалось получить данные геокодинга.')
  }

  const data = await response.json()
  return data.features || []
}

export async function geocodeBelarusAddress(query, cityLabel = '') {
  const normalizedQuery = String(query || '').trim()
  if (!normalizedQuery || normalizedQuery.length < 3) return []

  const searchQuery = cityLabel && !normalizedQuery.toLowerCase().includes(cityLabel.toLowerCase()) ? `${cityLabel}, ${normalizedQuery}` : normalizedQuery
  const encodedQuery = encodeURIComponent(searchQuery)
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=BY&language=ru&limit=5&types=address,poi,place,locality,neighborhood`
  const features = await fetchMapboxGeocoding(url)

  return features.map((feature) => {
    const cityName = getFeatureCityName(feature)
    const addressLine = getAddressLine(feature, cityName)

    return {
      id: feature.id,
      label: [cityName, addressLine].filter(Boolean).join(', ') || (feature.place_name_ru || feature.place_name || ''),
      cityName,
      addressLine,
      lat: feature.center?.[1],
      lng: feature.center?.[0],
    }
  })
}

export async function reverseGeocodeBelarusPoint({ lat, lng }) {
  if (!lat || !lng || !MAPBOX_TOKEN) return null

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&country=BY&language=ru&limit=1&types=address,poi,place,locality,neighborhood`
  const features = await fetchMapboxGeocoding(url)
  const feature = features[0]
  if (!feature) return null

  const cityName = getFeatureCityName(feature)
  const addressLine = getAddressLine(feature, cityName)

  return {
    cityName,
    addressLine,
    label: [cityName, addressLine].filter(Boolean).join(', ') || (feature.place_name_ru || feature.place_name || ''),
  }
}
