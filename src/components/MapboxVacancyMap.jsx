import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export function MapboxVacancyMap({ vacancies, selectedVacancyId, onSelect, className = '' }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapNodeRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    mapRef.current = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [27.5619, 53.9023],
      zoom: 10.5,
      attributionControl: false,
    })

    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    const bounds = new mapboxgl.LngLatBounds()

    vacancies.forEach((vacancy) => {
      const el = document.createElement('button')
      el.className = `mapboxMarker ${vacancy.id === selectedVacancyId ? 'is-active' : ''}`
      el.type = 'button'
      el.setAttribute('aria-label', vacancy.title)
      el.innerHTML = '<span class="mapboxMarker__dot"></span>'
      el.onclick = () => onSelect(vacancy.id)

      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([vacancy.lng, vacancy.lat])
        .addTo(map)

      markersRef.current.push(marker)
      bounds.extend([vacancy.lng, vacancy.lat])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 64, maxZoom: 12.5, duration: 0 })
    }
  }, [vacancies, selectedVacancyId, onSelect])

  useEffect(() => {
    const map = mapRef.current
    const active = vacancies.find((vacancy) => vacancy.id === selectedVacancyId)
    if (!map || !active) return

    map.flyTo({
      center: [active.lng, active.lat],
      zoom: Math.max(map.getZoom(), 11.5),
      essential: true,
      duration: 700,
    })
  }, [selectedVacancyId, vacancies])

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`mapboxFallback ${className}`.trim()}>
        Укажи `VITE_MAPBOX_TOKEN` в `.env`, и здесь появится Mapbox‑карта вакансий.
      </div>
    )
  }

  return <div ref={mapNodeRef} className={`mapboxCanvas ${className}`.trim()} />
}

