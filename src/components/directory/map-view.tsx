"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import Link from "next/link"

// Minimalist custom SVG icon logic to replace default Leaflet marker
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS1tYXAtcGluIj48cGF0aCBkPSJNMjAgMTBjMCA2LTggMTItOCAxMnMtOC02LTgtMTJhOCA4IDAgMCAxIDE2IDB6Ii8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMyIvPjwvc3ZnPg==',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
  className: "text-primary drop-shadow-md"
})

interface TopBusiness {
  id: string
  slug: string
  name: string
  category: string
  city: string
  location?: { lat: string; lng: string }
}

export interface MapViewProps {
  businesses: TopBusiness[]
  locale?: string
}

export function MapView({ businesses, locale = 'en' }: MapViewProps) {
  const mapCenter: [number, number] = businesses.length > 0 && businesses[0].location?.lat && businesses[0].location?.lng 
    ? [parseFloat(businesses[0].location.lat), parseFloat(businesses[0].location.lng)]
    : [20.659698, -103.349609] // Default to Guadalajara, Mexico

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-border shadow-sm ring-1 ring-ring/5">
      <MapContainer 
        center={mapCenter} 
        zoom={12} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles-muted"
        />
        {businesses.map((biz) => {
          if (!biz.location?.lat || !biz.location?.lng) return null
          
          return (
            <Marker 
              key={biz.id} 
              position={[parseFloat(biz.location.lat), parseFloat(biz.location.lng)]}
              icon={customIcon}
            >
              <Popup className="custom-popup">
                <div className="p-1 max-w-[280px]">
                  <h4 className="font-semibold text-foreground mb-1">{biz.name}</h4>
                  <p className="text-xs text-muted-foreground mb-2">{biz.city} • {biz.category}</p>
                  <Link 
                    href={`/${locale}/${biz.city}/${biz.slug}`}
                    className="inline-flex items-center text-xs font-medium text-primary hover:underline underline-offset-4"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      {businesses.filter(b => b.location?.lat && b.location?.lng).length === 0 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur px-6 py-3 rounded-full shadow-lg z-[1000] text-gray-700 font-medium text-sm border border-gray-200">
            No businesses have set their location yet.
        </div>
      )}
    </div>
  )
}
