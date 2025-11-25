import React, { useEffect, useRef, useState } from 'react';
import { Listing } from '../types';

interface MapViewProps {
  listings: Listing[];
  onSelectListing: (listing: Listing) => void;
}

const MapView: React.FC<MapViewProps> = ({ listings, onSelectListing }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [previewListing, setPreviewListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Access global Leaflet instance
    const L = (window as any).L;
    if (!L) return;

    // Initialize map if not exists
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([50.8503, 4.3517], 9); // Center on Brussels

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }).addTo(mapInstanceRef.current);
      
      L.control.zoom({ position: 'bottomright' }).addTo(mapInstanceRef.current);
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    listings.forEach(listing => {
        if (!listing.coordinates) return;

        const priceFormatted = `€${listing.price}`;
        const icon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div class="price-marker">${priceFormatted}</div>`,
            iconSize: [null, null],
            iconAnchor: [20, 15]
        });

        const marker = L.marker([listing.coordinates.lat, listing.coordinates.lng], { icon })
            .addTo(mapInstanceRef.current)
            .on('click', () => {
                setPreviewListing(listing);
                mapInstanceRef.current.flyTo([listing.coordinates!.lat, listing.coordinates!.lng], 14, {
                    duration: 1.5
                });
            });
        
        markersRef.current.push(marker);
    });

  }, [listings]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Listing Preview Card Overlay */}
      {previewListing && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 w-[90%] max-w-sm bg-white rounded-xl shadow-2xl z-[1000] overflow-hidden animate-fade-in-up border border-slate-100">
            <div className="relative h-40">
                <img src={previewListing.imageUrls[0]} alt={previewListing.name} className="w-full h-full object-cover" />
                <button 
                    onClick={(e) => { e.stopPropagation(); setPreviewListing(null); }}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div 
                className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => onSelectListing(previewListing)}
            >
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-slate-900 truncate">{previewListing.address}</h3>
                        <p className="text-xs text-slate-500 capitalize">{previewListing.type} • {previewListing.size} m²</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-slate-900">
                             <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                        </svg>
                        4.9
                    </div>
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                     <span className="font-bold text-slate-900">€{previewListing.price}</span>
                     <span className="text-slate-500 text-xs">/ month</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
