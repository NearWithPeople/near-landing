import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { getCategoryEmoji } from '../constants/vacancyCategories'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const SOURCE_ID = 'vacancies'
const CLUSTERS_LAYER_ID = 'vacancy-clusters'
const CLUSTER_COUNT_LAYER_ID = 'vacancy-cluster-count'
const POINTS_LAYER_ID = 'vacancy-points'
const SELECTED_GLOW_LAYER_ID = 'vacancy-selected-glow'
const SELECTED_LAYER_ID = 'vacancy-selected'
const BUILDINGS_LAYER_ID = 'vacancy-3d-buildings'

function getViewportPadding(hasSelection = false) {
  if (typeof window === 'undefined') {
    return { top: 150, right: hasSelection ? 460 : 24, bottom: 220, left: hasSelection ? 360 : 24 }
  }

  const desktopRailWidth = window.innerWidth >= 1280 ? 108 : window.innerWidth >= 1024 ? 92 : 0

  if (window.innerWidth >= 1024) {
    return {
      top: 120,
      right: hasSelection ? 500 : 40,
      bottom: hasSelection ? 120 : 80,
      left: desktopRailWidth + (hasSelection ? 220 : 40),
    }
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

function updateSourceData(map, vacancies) {
  const source = map.getSource(SOURCE_ID)
  if (!source) return
  source.setData(getFeatureCollection(vacancies))
}

function getVisibleVacancies(map, vacancies) {
  if (!map) return []

  const bounds = map.getBounds()

  return (vacancies || []).filter((vacancy) => {
    const lat = Number(vacancy.lat)
    const lng = Number(vacancy.lng)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false
    return bounds.contains([lng, lat])
  })
}

import { reverseGeocodeBelarusPoint } from '../services/mapboxGeocoding'

function updateBubblePositions(map, markersRef) {
  if (!map || !map.getCanvas()) return
  
  const width = map.getCanvas().clientWidth
  const height = map.getCanvas().clientHeight
  const centerLngLat = map.getCenter()
  const zoom = map.getZoom()

  markersRef.current.forEach((marker) => {
    const el = marker.getElement()
    const container = el.querySelector('.marker-container')
    if (!container) return

    const lngLat = marker.getLngLat()
    const pos = map.project(lngLat)
    
    // 1. Distance check (1km rule) - DISABLED to allow zoom-based shrinking for all markers
    /*
    const distMeters = centerLngLat.distanceTo(lngLat)
    const MAX_DIST = 1500 
    
    if (distMeters > MAX_DIST) {
      el.classList.add('is-hidden')
      return
    } else {
      el.classList.remove('is-hidden')
    }
    */

    // 2. Determine if shrunk
    const margin = 32
    const isPointOffscreen = pos.x < 0 || pos.x > width || pos.y < 0 || pos.y > height
    
    // Check if bubble (96px) would be partially off-screen
    const bubbleSize = 96
    const isBubbleOffscreen = 
      pos.x - bubbleSize / 2 < margin || 
      pos.x + bubbleSize / 2 > width - margin || 
      pos.y - bubbleSize - 20 < margin
      
    const isZoomedOut = zoom < 16.0
    const isExpanded = !isPointOffscreen && !isBubbleOffscreen && !isZoomedOut
    el.classList.toggle('is-expanded', isExpanded)

    if (isExpanded) {
      // Normal centered position (CSS handles the float up via translateY on bubble)
      container.style.transform = `translate(-50%, -50%)`
    } else {
      // Clamp to edges
      const clampedX = Math.max(margin, Math.min(width - margin, pos.x))
      const clampedY = Math.max(margin, Math.min(height - margin, pos.y))
      
      const shiftX = clampedX - pos.x
      const shiftY = clampedY - pos.y
      
      // Since container is centered on point, we just apply the shift
      container.style.transform = `translate(calc(-50% + ${shiftX}px), calc(-50% + ${shiftY}px))`
    }
  })
}

export function MapboxVacancyMap({ vacancies, selectedVacancyId, onSelect, onLocationChange, onVisibleVacanciesChange, centerPoint, className = '' }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef(new Map())
  const onSelectRef = useRef(onSelect)
  const onLocationChangeRef = useRef(onLocationChange)
  const onVisibleVacanciesChangeRef = useRef(onVisibleVacanciesChange)
  const vacanciesRef = useRef(vacancies)
  const selectedVacancyIdRef = useRef(selectedVacancyId)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

  useEffect(() => {
    onLocationChangeRef.current = onLocationChange
  }, [onLocationChange])

  useEffect(() => {
    onVisibleVacanciesChangeRef.current = onVisibleVacanciesChange
  }, [onVisibleVacanciesChange])

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

    const notifyVisibleVacancies = () => {
      if (!onVisibleVacanciesChangeRef.current) return
      onVisibleVacanciesChangeRef.current(getVisibleVacancies(map, vacanciesRef.current))
    }

    const handleMoveEnd = async () => {
      notifyVisibleVacancies()

      const currentZoom = map.getZoom()
      const center = map.getCenter()

      // 1. Auto-select vacancy on high zoom if one is visible and none selected
      if (currentZoom >= 16.5 && !selectedVacancyIdRef.current) {
        const features = map.queryRenderedFeatures({ layers: [POINTS_LAYER_ID] })
        if (features.length > 0) {
          // Find the one closest to center
          let closestFeature = features[0]
          let minDistance = Infinity
          
          features.forEach(f => {
            const fCoords = f.geometry.coordinates
            const dist = Math.sqrt(
              Math.pow(fCoords[0] - center.lng, 2) + 
              Math.pow(fCoords[1] - center.lat, 2)
            )
            if (dist < minDistance) {
              minDistance = dist
              closestFeature = f
            }
          })

          if (closestFeature) {
            onSelectRef.current(closestFeature.properties.id)
          }
        }
      }

      // 2. Reverse geocoding for top bar label
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
      notifyVisibleVacancies()
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
      updateSourceData(map, vacanciesRef.current)
      notifyVisibleVacancies()

      map.on('click', handleMapClick)
      
      // Re-apply 3D buildings on style change
      map.on('styledata', () => {
        ensureBuildingsLayer(map)
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
    if (!map || !map.isStyleLoaded() || !map.getLayer(CLUSTERS_LAYER_ID)) return

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
          
          const stableEmoji = getCategoryEmoji(vacancy.type || vacancy.category)

          const icon = document.createElement('div')
          icon.className = 'marker-icon'
          icon.textContent = stableEmoji
          
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
      if (onVisibleVacanciesChangeRef.current) {
        onVisibleVacanciesChangeRef.current(getVisibleVacancies(map, vacancies))
      }
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
      if (onVisibleVacanciesChangeRef.current) {
        onVisibleVacanciesChangeRef.current([])
      }
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

