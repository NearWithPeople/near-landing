import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

export function MapboxPointPicker({ value, onChange, centerPoint, className = '', hint = '' }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapNodeRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [value?.lng || centerPoint?.lng || 27.5619, value?.lat || centerPoint?.lat || 53.9023],
      zoom: centerPoint?.zoom || 11,
      attributionControl: false,
      fadeDuration: 0,
    })

    const marker = new mapboxgl.Marker({
      color: '#5b7065',
      scale: 1.08,
    })

    mapRef.current = map
    markerRef.current = marker
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    if (value?.lat && value?.lng) {
      marker.setLngLat([value.lng, value.lat]).addTo(map)
    }

    function handleMapPick(event) {
      const nextPoint = {
        lat: Number(event.lngLat.lat.toFixed(6)),
        lng: Number(event.lngLat.lng.toFixed(6)),
      }
      marker.setLngLat([nextPoint.lng, nextPoint.lat]).addTo(map)
      onChangeRef.current?.(nextPoint)
    }

    map.on('click', handleMapPick)

    map.once('load', () => {
      map.resize()
      window.requestAnimationFrame(() => map.resize())
    })

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(mapNodeRef.current)

    return () => {
      resizeObserver.disconnect()
      marker.remove()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (!map || !marker) return

    if (value?.lat && value?.lng) {
      marker.setLngLat([value.lng, value.lat]).addTo(map)
      map.flyTo({
        center: [value.lng, value.lat],
        zoom: Math.max(map.getZoom(), 14),
        essential: true,
        duration: 0,
      })
      return
    }

    marker.remove()
  }, [value])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !centerPoint) return

    if (!value?.lat || !value?.lng) {
      map.flyTo({
        center: [centerPoint.lng, centerPoint.lat],
        zoom: centerPoint.zoom || 11,
        essential: true,
        duration: 0,
      })
    }
  }, [centerPoint, value])

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`mapboxFallback ${className}`.trim()}>
        Укажи `VITE_MAPBOX_TOKEN` в `.env`, чтобы выбирать точку вакансии на карте.
      </div>
    )
  }

  return (
    <div className={`mapboxPointPicker ${className}`.trim()}>
      <div ref={mapNodeRef} className="mapboxCanvas mapboxPointPicker__canvas" />
      {hint ? <div className="mapboxPointPicker__hint">{hint}</div> : null}
    </div>
  )
}
