"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom marker icon (Leaflet's default icon breaks with bundlers)
const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPinPickerProps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: string;
}

// Sub-component to recenter map when coordinates change externally
function RecenterMap({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

// Draggable marker sub-component
function DraggableMarker({
  position,
  onDragEnd,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
}) {
  const markerRef = useRef<L.Marker>(null);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const latlng = marker.getLatLng();
          onDragEnd(latlng.lat, latlng.lng);
        }
      },
    }),
    [onDragEnd]
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  );
}

export default function MapPinPicker({
  latitude,
  longitude,
  accuracy,
  onLocationChange,
  height = "220px",
}: MapPinPickerProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div
        className="rounded-xl bg-slate-100 animate-pulse flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-xs font-semibold text-slate-400">Loading map...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Accuracy indicator */}
      {accuracy != null && accuracy > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200/50 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-blue-600">
            Detected within ~{Math.round(accuracy)}m — drag the pin to your exact location
          </span>
        </div>
      )}

      {/* Map container */}
      <div
        className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"
        style={{ height }}
      >
        <MapContainer
          center={[latitude, longitude]}
          zoom={17}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <RecenterMap lat={latitude} lng={longitude} />
          <DraggableMarker
            position={[latitude, longitude]}
            onDragEnd={onLocationChange}
          />
          {/* Show accuracy radius circle */}
          {accuracy != null && accuracy > 0 && (
            <Circle
              center={[latitude, longitude]}
              radius={accuracy}
              pathOptions={{
                color: "#3b82f6",
                fillColor: "#3b82f6",
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: "4 6",
              }}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-[10px] text-slate-400 font-semibold text-center">
        Drag the marker to pinpoint your exact location
      </p>
    </div>
  );
}
