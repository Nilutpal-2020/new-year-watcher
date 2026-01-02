import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Rectangle, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map when midnight longitude changes
function MapController({ midnightLon }) {
    const map = useMap();

    useEffect(() => {
        // Soft Recenter: Only move if the center is quite far from the midnight line.
        // This allows users to explore without constant snapping.
        const currentCenter = map.getCenter();
        const diff = Math.abs(currentCenter.lng - midnightLon);

        // We handle the wrap-around case briefly
        const normalizedDiff = diff > 180 ? 360 - diff : diff;

        if (normalizedDiff > 30) {
            map.panTo([20, midnightLon], { animate: true, duration: 2 });
        }
    }, [midnightLon, map]);

    return null;
}

const MapViz = React.memo(({ midnightLon, theme }) => {
    const [isHovered, setIsHovered] = useState(false);
    // Define the "New Year Zone" rectangle.
    // It spans from the International Date Line (180) to the current midnight longitude.
    // Note: Geometries crossing the 180/-180 meridian can be tricky in Leaflet.
    // We simplify by drawing from midnightLon TO 180 East.

    // Bounds: [[South, West], [North, East]]
    const alreadyCelebratedBounds = [
        [-90, midnightLon],
        [90, 180]
    ];

    // If midnight line is in negative (West), we also need to cover the entire Eastern Hemisphere
    // This is a simplified visual. 
    // A robust approach creates two rectangles if crossing 180, 
    // but our "midnightLon" moves from 180 down to -180 linearly.

    const darkTiles = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    const lightTiles = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 transition-colors">
            <MapContainer
                center={[20, 0]}
                zoom={1.5}
                minZoom={1.5}
                maxZoom={10}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", background: theme === 'dark' ? "#0f172a" : "#cbd5e1" }}
                zoomControl={true}
            >
                <MapController midnightLon={midnightLon} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                    url={theme === 'dark' ? darkTiles : lightTiles}
                />

                <Polyline
                    positions={[[-90, midnightLon], [90, midnightLon]]}
                    pathOptions={{
                        color: theme === 'dark' ? '#f59e0b' : '#ea580c',
                        weight: isHovered ? 4 : 2,
                        dashArray: isHovered ? '0' : '5, 10'
                    }}
                    eventHandlers={{
                        mouseover: () => setIsHovered(true),
                        mouseout: () => setIsHovered(false),
                    }}
                >
                    <Tooltip permanent={false} direction="left" offset={[-5, 0]} className={`${theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-white text-orange-600'} border border-slate-200 dark:border-slate-700 font-bold px-2 py-1 rounded shadow-xl`}>
                        Midnight Line
                    </Tooltip>
                </Polyline>

                {/* The "Already Celebrated" Zone (Gold Overlay) */}
                <Rectangle
                    bounds={alreadyCelebratedBounds}
                    pathOptions={{
                        color: "transparent",
                        fillColor: theme === 'dark' ? "#f59e0b" : "#f97316",
                        fillOpacity: 0.2
                    }}
                />

                {/* Helper text if the logic wraps weirdly around the date line, 
            we usually handle 180->0 and 0->-180. 
            Visual approximation is sufficient per requirements. 
        */}
            </MapContainer>
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.theme === nextProps.theme &&
        Math.abs(prevProps.midnightLon - nextProps.midnightLon) < 0.05
    )
});

export default MapViz;