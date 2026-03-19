import { useState, useRef } from "react";
import { Search, Navigation, ZoomIn, ZoomOut } from "lucide-react";
import { restaurants } from "../data/mockData";
import { useNavigate } from "react-router";
import medellinMapImage from 'figma:asset/fe1dd671fa3a9e07e7e2fbf36b2aeb613fc5bfcc.png';

// Medellín map bounds (approximate)
const MAP_CONFIG = {
  centerLat: 6.2442,
  centerLng: -75.5812,
  minLat: 6.15,
  maxLat: 6.35,
  minLng: -75.65,
  maxLng: -75.50,
};

export function MapScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);

  // Convert lat/lng to x/y coordinates on the map
  const latLngToXY = (lat: number, lng: number, containerWidth: number, containerHeight: number) => {
    const xPercent = ((lng - MAP_CONFIG.minLng) / (MAP_CONFIG.maxLng - MAP_CONFIG.minLng));
    const yPercent = ((MAP_CONFIG.maxLat - lat) / (MAP_CONFIG.maxLat - MAP_CONFIG.minLat));
    
    return {
      x: xPercent * containerWidth * zoom + pan.x,
      y: yPercent * containerHeight * zoom + pan.y
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.3, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.3, 0.5));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Search Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-10 z-30">
        <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search restaurants or food (e.g. burgers, sushi)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Interactive Map */}
      <div
        ref={mapRef}
        className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map Background Image - Google Maps of Medellín */}
        <div
          className="absolute inset-0"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: '0 0',
            transition: isDragging ? 'none' : 'transform 0.2s ease-out',
            backgroundImage: `url(${medellinMapImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 70%', // Recorta la parte superior
            width: '100%',
            height: '100%'
          }}
        >
          {/* Restaurant Markers */}
          {restaurants.map((restaurant) => {
            const { x, y } = latLngToXY(
              restaurant.latitude,
              restaurant.longitude,
              mapRef.current?.clientWidth || 390,
              mapRef.current?.clientHeight || 800
            );

            return (
              <RestaurantMarker
                key={restaurant.id}
                restaurant={restaurant}
                x={x}
                y={y}
                isHovered={hoveredMarker === restaurant.id}
                onHover={() => setHoveredMarker(restaurant.id)}
                onLeave={() => setHoveredMarker(null)}
                onClick={() => navigate(`/restaurant/${restaurant.id}`)}
              />
            );
          })}
        </div>
      </div>

      {/* Zoom Controls */}
      <button
        onClick={handleZoomIn}
        className="absolute top-32 right-4 w-12 h-12 bg-white rounded-t-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all z-30 border-b border-gray-200"
      >
        <ZoomIn className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={handleZoomOut}
        className="absolute top-44 right-4 w-12 h-12 bg-white rounded-b-xl shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all z-30"
      >
        <ZoomOut className="w-5 h-5 text-gray-700" />
      </button>

      {/* My Location / Reset Button */}
      <button
        onClick={resetView}
        className="absolute bottom-28 right-4 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all z-30"
      >
        <Navigation className="w-5 h-5 text-[#FF6B35]" />
      </button>

      {/* Map Legend */}
      <div className="absolute top-24 left-4 bg-white rounded-xl shadow-md px-3 py-2 z-30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-[#FF6B35] rounded-full"></div>
          <span className="text-xs text-gray-600">Restaurante</span>
        </div>
      </div>

      {/* Map Instructions */}
      {zoom === 1 && pan.x === 0 && pan.y === 0 && (
        <div className="absolute bottom-44 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-4 py-2 rounded-full z-20 pointer-events-none">
          Arrastra el mapa para explorar
        </div>
      )}
    </div>
  );
}

interface RestaurantMarkerProps {
  restaurant: any;
  x: number;
  y: number;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
}

function RestaurantMarker({ restaurant, x, y, isHovered, onHover, onLeave, onClick }: RestaurantMarkerProps) {
  return (
    <div
      className="absolute pointer-events-auto"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
        zIndex: isHovered ? 25 : 20
      }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      {/* Marker Pin */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="relative group cursor-pointer"
      >
        {/* Pin Shape */}
        <div className={`w-10 h-10 bg-[#FF6B35] rounded-full shadow-lg flex items-center justify-center border-4 border-white transition-transform ${isHovered ? 'scale-125' : 'group-hover:scale-110'}`}>
          <div className="w-3 h-3 bg-white rounded-full"></div>
        </div>
        
        {/* Pin Point */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent border-t-[#FF6B35]"></div>

        {/* Info Popup on Hover */}
        {isHovered && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl p-3 w-48 z-50 animate-in fade-in zoom-in-95 duration-200">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-24 object-cover rounded-lg mb-2"
            />
            <h3 className="font-semibold text-sm text-gray-900 mb-1">
              {restaurant.name}
            </h3>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xs ${
                      i < Math.floor(restaurant.rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-600">{restaurant.rating}</span>
            </div>
            <p className="text-xs text-gray-500 mb-2">{restaurant.category}</p>
            <div className="w-full py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-semibold text-center">
              Ver Detalles
            </div>
          </div>
        )}
      </button>
    </div>
  );
}