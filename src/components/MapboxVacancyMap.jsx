import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''
const SOURCE_ID = 'vacancies'
const CLUSTERS_LAYER_ID = 'vacancy-clusters'
const CLUSTER_COUNT_LAYER_ID = 'vacancy-cluster-count'
const POINTS_LAYER_ID = 'vacancy-points'
const SELECTED_GLOW_LAYER_ID = 'vacancy-selected-glow'
const SELECTED_LAYER_ID = 'vacancy-selected'

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
      clusterMaxZoom: 13,
      clusterRadius: 52,
    })
  }

  if (!map.getLayer(CLUSTERS_LAYER_ID)) {
    map.addLayer({
      id: CLUSTERS_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': ['step', ['get', 'point_count'], '#2463ea', 5, '#3d7eff', 12, '#7a5cff'],
        'circle-radius': ['step', ['get', 'point_count'], 20, 5, 24, 12, 28],
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgba(255,255,255,0.18)',
        'circle-blur': 0.08,
      },
    })
  }

  if (!map.getLayer(CLUSTER_COUNT_LAYER_ID)) {
    map.addLayer({
      id: CLUSTER_COUNT_LAYER_ID,
      type: 'symbol',
      source: SOURCE_ID,
      filter: ['has', 'point_count'],
      layout: {
        'text-field': ['get', 'point_count_abbreviated'],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 12,
      },
      paint: {
        'text-color': '#ffffff',
      },
    })
  }

  if (!map.getLayer(POINTS_LAYER_ID)) {
    map.addLayer({
      id: POINTS_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-radius': 7,
        'circle-color': '#f39f5a',
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(29, 26, 57, 0.92)',
      },
    })
  }

  if (!map.getLayer(SELECTED_GLOW_LAYER_ID)) {
    map.addLayer({
      id: SELECTED_GLOW_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['get', 'id'], ''],
      paint: {
        'circle-radius': 16,
        'circle-color': 'rgba(174, 68, 90, 0.24)',
      },
    })
  }

  if (!map.getLayer(SELECTED_LAYER_ID)) {
    map.addLayer({
      id: SELECTED_LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      filter: ['==', ['get', 'id'], ''],
      paint: {
        'circle-radius': 9,
        'circle-color': '#ae445a',
        'circle-stroke-width': 3,
        'circle-stroke-color': 'rgba(255,255,255,0.92)',
      },
    })
  }
}

function updateSourceData(map, vacancies) {
  const source = map.getSource(SOURCE_ID)
  if (!source) return
  source.setData(getFeatureCollection(vacancies))
}

function updateSelectedFilter(map, selectedVacancyId) {
  const filter = ['==', ['get', 'id'], selectedVacancyId || '']
  if (map.getLayer(SELECTED_GLOW_LAYER_ID)) {
    map.setFilter(SELECTED_GLOW_LAYER_ID, filter)
  }
  if (map.getLayer(SELECTED_LAYER_ID)) {
    map.setFilter(SELECTED_LAYER_ID, filter)
  }
}

export function MapboxVacancyMap({ vacancies, selectedVacancyId, onSelect, centerPoint, className = '' }) {
  const mapNodeRef = useRef(null)
  const mapRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  const vacanciesRef = useRef(vacancies)
  const selectedVacancyIdRef = useRef(selectedVacancyId)

  useEffect(() => {
    onSelectRef.current = onSelect
  }, [onSelect])

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
      attributionControl: false,
      fadeDuration: 0,
    })

    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')

    const handleClusterClick = (event) => {
      const feature = event.features?.[0]
      const source = map.getSource(SOURCE_ID)
      if (!feature || !source) return

      source.getClusterExpansionZoom(feature.properties.cluster_id, (error, zoom) => {
        if (error) return
        map.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 650,
        })
      })
    }

    const handlePointClick = (event) => {
      const feature = event.features?.[0]
      const vacancyId = feature?.properties?.id
      if (!vacancyId) return
      onSelectRef.current(vacancyId)
    }

    const handleMapClick = (event) => {
      const interactiveFeatures = map.queryRenderedFeatures(event.point, {
        layers: [CLUSTERS_LAYER_ID, POINTS_LAYER_ID, SELECTED_GLOW_LAYER_ID, SELECTED_LAYER_ID],
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
      updateSourceData(map, vacanciesRef.current)
      updateSelectedFilter(map, selectedVacancyIdRef.current)

      map.on('click', CLUSTERS_LAYER_ID, handleClusterClick)
      map.on('click', POINTS_LAYER_ID, handlePointClick)
      map.on('click', SELECTED_LAYER_ID, handlePointClick)
      map.on('click', handleMapClick)

      map.on('mouseenter', CLUSTERS_LAYER_ID, handleMouseEnter)
      map.on('mouseenter', POINTS_LAYER_ID, handleMouseEnter)
      map.on('mouseenter', SELECTED_LAYER_ID, handleMouseEnter)

      map.on('mouseleave', CLUSTERS_LAYER_ID, handleMouseLeave)
      map.on('mouseleave', POINTS_LAYER_ID, handleMouseLeave)
      map.on('mouseleave', SELECTED_LAYER_ID, handleMouseLeave)
    })

    return () => {
      map.getCanvas().style.cursor = ''
      map.remove()
      mapRef.current = null
    }
  }, [])

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
    updateSelectedFilter(map, selectedVacancyId)

    const bounds = new mapboxgl.LngLatBounds()
    vacancies.forEach((vacancy) => {
      bounds.extend([vacancy.lng, vacancy.lat])
    })

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: getViewportPadding(Boolean(selectedVacancyId)),
        maxZoom: 12.5,
        duration: 0,
      })
      return
    }

    if (centerPoint && vacancies.length === 0) {
      map.flyTo({
        center: [centerPoint.lng, centerPoint.lat],
        zoom: centerPoint.zoom || 10.8,
        essential: true,
        duration: 0,
      })
    }
  }, [vacancies, selectedVacancyId, centerPoint])

  useEffect(() => {
    const map = mapRef.current
    const active = vacancies.find((vacancy) => vacancy.id === selectedVacancyId)
    if (!map || !active) return

    map.flyTo({
      center: [active.lng, active.lat],
      zoom: Math.max(map.getZoom(), 14),
      padding: getViewportPadding(true),
      essential: true,
      duration: 0,
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

