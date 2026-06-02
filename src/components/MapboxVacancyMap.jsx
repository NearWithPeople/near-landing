import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const SOURCE_ID = 'vacancies'
const CLUSTERS_LAYER_ID = 'vacancy-clusters'
const CLUSTER_COUNT_LAYER_ID = 'vacancy-cluster-count'
const POINTS_LAYER_ID = 'vacancy-points'
const SELECTED_GLOW_LAYER_ID = 'vacancy-selected-glow'
const SELECTED_LAYER_ID = 'vacancy-selected'
const BUILDINGS_LAYER_ID = 'vacancy-3d-buildings'
const MINSK_MODEL_SHADOW_SOURCE_ID = 'minsk-landmark-shadow-source'
const MINSK_MODEL_SHADOW_LAYER_ID = 'minsk-landmark-shadow-layer'
const MINSK_MODEL_ORIGIN = [27.5619, 53.9023]
const MINSK_MODEL_ALTITUDE = 2000

function getViewportPadding(hasSelection = false) {
  if (typeof window === 'undefined') {
    return { top: 150, right: 24, bottom: 220, left: hasSelection ? 360 : 24 }
  }

  if (window.innerWidth <= 560) {
    return { top: 210, right: 12, bottom: 240, left: 12 }
  }

  if (window.innerWidth <= 900) {
    return { top: 180, right: 16, bottom: 220, left: 16 }
  }

  return { top: 150, right: 24, bottom: 220, left: hasSelection ? 396 : 24 }
}

function getFeatureCollection(vacancies) {
  return {
    type: 'FeatureCollection',
    features: vacancies.map((vacancy) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [vacancy.lng, vacancy.lat],
      },
      properties: {
        id: vacancy.id,
        title: vacancy.title,
        payFrom: vacancy.payFrom,
      },
    })),
  }
}

function ensureSourceAndLayers(map) {
  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: getFeatureCollection([]),
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50,
    })
  }

  // Invisible layer to allow querying clusters
  if (!map.getLayer(CLUSTERS_LAYER_ID)) {
    map.addLayer({
      id: CLUSTERS_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-radius': 0,
        'circle-opacity': 0
      },
    })
  }

  // Invisible layer to allow querying individual points
  if (!map.getLayer(POINTS_LAYER_ID)) {
    map.addLayer({
      id: POINTS_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 0,
        'circle-opacity': 0
      },
    })
  }
}

function ensureBuildingsLayer(map) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return

  const labelLayer = map
    .getStyle()
    ?.layers?.find((layer) => layer.type === 'symbol' && layer.layout?.['text-field'])?.id

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
      source: 'composite',
      'source-layer': 'building',
      filter: ['==', ['get', 'extrude'], 'true'],
      type: 'fill-extrusion',
      minzoom: 12,
      paint: {
        'fill-extrusion-color': '#6b4fa3',
        'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 15.5, ['get', 'height']],
        'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 15.5, ['get', 'min_height']],
        'fill-extrusion-opacity': 0.72,
      },
    },
    labelLayer
  )
}

function getMinskShadowCoordinates() {
  const [lng, lat] = MINSK_MODEL_ORIGIN
  const altitudeMeters = MINSK_MODEL_ALTITUDE

  // Match shadow direction with key light direction (80, -60, 140).
  const horizontalLength = Math.sqrt(80 * 80 + 60 * 60)
  const verticalLength = 140
  // Keep shadow visible near the model even at very high altitude values.
  const rawShadowDistance = altitudeMeters * (horizontalLength / verticalLength)
  const shadowDistanceMeters = Math.min(450, rawShadowDistance * 0.22)

  const dirX = -80 / horizontalLength
  const dirY = 60 / horizontalLength
  const eastMeters = shadowDistanceMeters * dirX
  const northMeters = shadowDistanceMeters * dirY

  const metersPerDegreeLat = 111320
  const metersPerDegreeLng = 111320 * Math.cos((lat * Math.PI) / 180)

  return [
    lng + eastMeters / metersPerDegreeLng,
    lat + northMeters / metersPerDegreeLat,
  ]
}

function ensureMinskShadowLayer(map) {
  const shadowData = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: getMinskShadowCoordinates(),
        },
        properties: {},
      },
    ],
  }

  if (!map.getSource(MINSK_MODEL_SHADOW_SOURCE_ID)) {
    map.addSource(MINSK_MODEL_SHADOW_SOURCE_ID, {
      type: 'geojson',
      data: shadowData,
    })
  } else {
    const shadowSource = map.getSource(MINSK_MODEL_SHADOW_SOURCE_ID)
    shadowSource?.setData(shadowData)
  }

  if (!map.getLayer(MINSK_MODEL_SHADOW_LAYER_ID)) {
    map.addLayer({
      id: MINSK_MODEL_SHADOW_LAYER_ID,
      type: 'circle',
      source: MINSK_MODEL_SHADOW_SOURCE_ID,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          8, 34,
          12, 56,
          16, 84,
        ],
        'circle-color': 'rgba(0, 0, 0, 0.36)',
        'circle-blur': 0.95,
        'circle-opacity': 0.72,
        'circle-pitch-alignment': 'map',
        'circle-pitch-scale': 'map',
      },
    })
  }
}

function updateSourceData(map, vacancies) {
  const source = map.getSource(SOURCE_ID)
  if (!source) return
  source.setData(getFeatureCollection(vacancies))
}

import { reverseGeocodeBelarusPoint } from '../services/mapboxGeocoding'

function updateBubblePositions(map, markersRef) {
  if (!map) return
  
  const width = map.getCanvas().clientWidth
  const height = map.getCanvas().clientHeight
  const centerLngLat = map.getCenter()

  markersRef.current.forEach((marker) => {
    const el = marker.getElement()
    const container = el.querySelector('.marker-container')
    if (!container) return

    const lngLat = marker.getLngLat()
    const pos = map.project(lngLat)
    
    // 1. Distance check (1km rule)
    // We use a slightly larger buffer for better UX, e.g. 1.5km
    const distMeters = centerLngLat.distanceTo(lngLat)
    const MAX_DIST = 1500 
    
    if (distMeters > MAX_DIST) {
      el.classList.add('is-hidden')
      return
    } else {
      el.classList.remove('is-hidden')
    }

    // 2. Clamping and Shrinking logic
    const margin = 32
    const isPointOffscreen = pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height
    
    // Determine if we should shrink
    const containerWidth = container.offsetWidth || 96
    const containerHeight = container.offsetHeight || 96
    
    // Check if bubble would be partially off-screen
    const isBubbleOffscreen = 
      pos.x - containerWidth / 2 < margin || 
      pos.x + containerWidth / 2 > width - margin || 
      pos.y - containerHeight - 20 < margin // 20 is gap + dot
      
    const isShrunk = isPointOffscreen || isBubbleOffscreen
    el.classList.toggle('is-offscreen', isShrunk)

    if (isShrunk) {
      // Clamp to edges
      const clampedX = Math.max(margin, Math.min(width - margin, pos.x))
      const clampedY = Math.max(margin, Math.min(height - margin, pos.y))
      
      const shiftX = clampedX - pos.x
      const shiftY = clampedY - pos.y
      
      // Counteract the absolute positioning (bottom: 100%) and center it
      container.style.transform = `translate(calc(-50% + ${shiftX}px), calc(50% + ${shiftY}px))`
    } else {
      // Normal centered position
      container.style.transform = `translateX(-50%)`
    }
  })
}

export function MapboxVacancyMap({ vacancies, selectedVacancyId, onSelect, onLocationChange, centerPoint, className = '' }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const onLocationChangeRef = useRef(onLocationChange)
  const vacanciesRef = useRef(vacancies)
  const selectedVacancyIdRef = useRef(selectedVacancyId)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    vacanciesRef.current = vacancies
  }, [vacancies])

  useEffect(() => {
    selectedVacancyIdRef.current = selectedVacancyId
  }, [selectedVacancyId])

  useEffect(() => {
    if (!MAPBOX_TOKEN || !mapNodeRef.current || mapRef.current) return

    mapboxgl.accessToken = MAPBOX_TOKEN
    const map = new mapboxgl.Map({
      container: mapNodeRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [centerPoint?.lng || 27.5619, centerPoint?.lat || 53.9023],
      zoom: centerPoint?.zoom || 10.5,
      pitch: 60,
      bearing: -20,
      attributionControl: false,
      fadeDuration: 0,
      antialias: true,
    })

    mapRef.current = map

    const handleMoveEnd = async () => {
      const currentZoom = map.getZoom()
      const center = map.getCenter()

      // 1. Reverse geocoding for top bar label
      if (onLocationChangeRef.current) {
        try {
          const locationData = await reverseGeocodeBelarusPoint({ lat: center.lat, lng: center.lng })
          if (locationData) {
            // Depending on zoom, show different levels of detail
            let label = locationData.cityName || 'Беларусь'
            if (currentZoom > 14) {
              label = locationData.addressLine || locationData.cityName
            } else if (currentZoom > 11) {
              // Try to find neighborhood/district if available in full label
              const parts = locationData.label.split(', ')
              label = parts[1] || locationData.cityName
            }
            onLocationChangeRef.current(label)
          }
        } catch (e) {
          console.error('Geocoding error:', e)
        }
      }
    }

    map.on('moveend', handleMoveEnd)
    map.on('move', () => {
      updateMarkers()
      updateBubblePositions(map, markersRef)
    })
    map.on('sourcedata', (e) => {
      if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
        updateMarkers()
      }
    })

    const handleMapClick = (event) => {
      const interactiveFeatures = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTERS_LAYER_ID],
      })
      if (interactiveFeatures.length > 0) return
      onSelectRef.current?.('')
    }

    const handleMouseEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }

    const handleMouseLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.once('load', () => {
      ensureSourceAndLayers(map)
      ensureBuildingsLayer(map)
      ensureMinskShadowLayer(map)
      updateSourceData(map, vacanciesRef.current)

      map.on('click', handleMapClick)
      
      // Re-apply 3D buildings on style change
      map.on('styledata', () => {
        ensureBuildingsLayer(map)
        ensureMinskShadowLayer(map)
      })
    })

    return () => {
      map.getCanvas().style.cursor = ''
      map.off('moveend', handleMoveEnd)
      markersRef.current.forEach(marker => marker.remove())
      markersRef.current.clear()
      map.remove()
      mapRef.current = null
    }
  }, [])

  const updateMarkers = () => {
    const map = mapRef.current
    if (!map) return

    // 1. Get all rendered features (clusters and individual points)
    const features = map.queryRenderedFeatures({ layers: [CLUSTERS_LAYER_ID, POINTS_LAYER_ID] })
    const currentMarkers = markersRef.current

    // Track which markers should stay
    const newMarkerKeys = new Set()

    features.forEach((feature) => {
      const isCluster = feature.properties.cluster
      const id = isCluster ? `cluster-${feature.properties.cluster_id}` : `point-${feature.properties.id}`
      newMarkerKeys.add(id)

      let marker = currentMarkers.get(id)
      const coords = feature.geometry.coordinates

      if (!marker) {
        const el = document.createElement('div')
        el.className = 'custom-vacancy-marker'
        
        const dot = document.createElement('div')
        dot.className = 'marker-dot'
        el.appendChild(dot)
        
        const container = document.createElement('div')
        container.className = 'marker-container'
        el.appendChild(container)

        if (isCluster) {
          const count = feature.properties.point_count
          const cluster = document.createElement('div')
          cluster.className = 'marker-cluster'
          cluster.textContent = count
          
          if (count < 5) cluster.classList.add('marker-cluster--small')
          else if (count < 10) cluster.classList.add('marker-cluster--medium')
          else cluster.classList.add('marker-cluster--large')
          
          container.appendChild(cluster)
          
          cluster.onclick = (e) => {
            e.stopPropagation()
            const source = map.getSource(SOURCE_ID)
            source.getClusterExpansionZoom(feature.properties.cluster_id, (err, zoom) => {
              if (err) return
              map.easeTo({
                center: coords,
                zoom: zoom + 0.5,
                duration: 800
              })
            })
          }
        } else {
          const vacancyId = feature.properties.id
          const vacancy = vacanciesRef.current.find(v => v.id === vacancyId)
          if (!vacancy) return

          const bubble = document.createElement('div')
          bubble.className = 'marker-bubble'
          
          const iconMap = {
            'Курьер': '/map-icons/map-pin.png',
            'Склад': '/map-icons/notepad-text.png',
            'Промо': '/map-icons/losso.png',
            'HoReCa': '/map-icons/list.png',
            'Подсобные': '/map-icons/notepad-text.png'
          }
          
          const icon = document.createElement('img')
          icon.className = 'marker-icon'
          icon.src = iconMap[vacancy.category] || '/map-icons/map-pin.png'
          
          bubble.appendChild(icon)
          container.appendChild(bubble)
          
          bubble.onclick = (e) => {
            e.stopPropagation()
            onSelectRef.current(vacancyId)
            map.flyTo({
              center: coords,
              zoom: Math.max(map.getZoom(), 16),
              padding: getViewportPadding(true),
              duration: 800
            })
          }
        }

        marker = new mapboxgl.Marker({ element: el })
          .setLngLat(coords)
          .addTo(map)
        
        currentMarkers.set(id, marker)
      } else {
        // Update existing marker position if needed
        marker.setLngLat(coords)
      }

      // Update active state for individual points
      if (!isCluster) {
        const el = marker.getElement()
        el.classList.toggle('is-active', feature.properties.id === selectedVacancyIdRef.current)
      }
    })

    // Remove markers that are no longer visible or clustered
    currentMarkers.forEach((marker, id) => {
      if (!newMarkerKeys.has(id)) {
        marker.remove()
        currentMarkers.delete(id)
      }
    })
    
    setTimeout(() => updateBubblePositions(map, markersRef), 0)
  }

  useEffect(() => {
    updateMarkers()
  }, [vacancies, selectedVacancyId])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return undefined

    function handleResize() {
      map.resize()
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !map.isStyleLoaded()) return

    updateSourceData(map, vacancies)

    const bounds = new mapboxgl.LngLatBounds()
    vacancies.forEach((vacancy) => {
      bounds.extend([vacancy.lng, vacancy.lat])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: getViewportPadding(Boolean(selectedVacancyIdRef.current)),
        maxZoom: 12.5,
        duration: 0,
        pitch: 60,
        bearing: -20,
      })
      return
    }

    if (centerPoint && vacancies.length === 0) {
      map.flyTo({
        center: [centerPoint.lng, centerPoint.lat],
        zoom: centerPoint.zoom || 10.8,
        pitch: 60,
        bearing: -20,
        essential: true,
        duration: 0,
      })
    }
  }, [vacancies, centerPoint])

  useEffect(() => {
    const map = mapRef.current
    const active = vacancies.find((vacancy) => vacancy.id === selectedVacancyId)
    if (!map || !active) return

    map.flyTo({
      center: [active.lng, active.lat],
      zoom: Math.max(map.getZoom(), 16), // Zoom in more for 3D effect
      padding: getViewportPadding(true),
      pitch: 60,
      bearing: -20,
      essential: true,
      duration: 800, // Smooth transition
    })
  }, [selectedVacancyId, vacancies])

  if (!MAPBOX_TOKEN) {
    return (
      <div className={`mapboxFallback ${className}`.trim()}>
        Укажи `VITE_MAPBOX_TOKEN` в `.env`, и здесь появится Mapbox-карта вакансий.
      </div>
    )
  }

  return <div ref={mapNodeRef} className={`mapboxCanvas ${className}`.trim()} />
}

