export const DEFAULT_CITY_VALUE = 'minsk'

export const BELARUS_CITY_OPTIONS = [
  { value: 'all', label: 'Вся Беларусь', lat: 53.7098, lng: 27.9534, zoom: 6.2 },
  { value: 'minsk', label: 'Минск', lat: 53.9023, lng: 27.5619, zoom: 10.8 },
  { value: 'brest', label: 'Брест', lat: 52.0976, lng: 23.7341, zoom: 11 },
  { value: 'vitebsk', label: 'Витебск', lat: 55.1904, lng: 30.2049, zoom: 11 },
  { value: 'gomel', label: 'Гомель', lat: 52.4412, lng: 30.9878, zoom: 11 },
  { value: 'grodno', label: 'Гродно', lat: 53.6694, lng: 23.8131, zoom: 11 },
  { value: 'mogilev', label: 'Могилев', lat: 53.9007, lng: 30.3314, zoom: 11 },
]

export function getCityOption(value) {
  return BELARUS_CITY_OPTIONS.find((city) => city.value === value) || BELARUS_CITY_OPTIONS.find((city) => city.value === DEFAULT_CITY_VALUE)
}

export function getCityPoint(value) {
  const city = getCityOption(value)
  return { lat: city.lat, lng: city.lng, zoom: city.zoom }
}

export function getCityNameFromAddress(address = '') {
  return address.split(',')[0]?.trim() || ''
}
