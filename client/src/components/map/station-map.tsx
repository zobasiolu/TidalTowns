import { useRef, useEffect, useState } from "react";
import { TideStation } from "@shared/schema";
import { motion } from "framer-motion";

interface StationMapProps {
  stations: TideStation[];
  selectedStation: TideStation | null;
  onSelectStation: (station: TideStation) => void;
}

export default function StationMap({
  stations,
  selectedStation,
  onSelectStation
}: StationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  
  // Update map dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (mapRef.current) {
        setMapDimensions({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight
        });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Convert lat/long to x/y position
  const getMarkerPosition = (lat: number, long: number) => {
    // Simple conversion for visualization - not actual geographic projection
    // Assumes map covers approximately -180 to 180 longitude and -90 to 90 latitude
    const x = ((long + 180) / 360) * 100; // Convert to percentage of map width
    const y = (1 - ((lat + 90) / 180)) * 100; // Convert to percentage of map height (inverted)
    
    return { x, y };
  };

  return (
    <div 
      ref={mapRef}
      className="absolute inset-0 bg-blue-100 p-4 overflow-hidden"
    >
      {/* World Map Background */}
      <div className="w-full h-full relative rounded-lg" style={{ 
        backgroundImage: `url("https://upload.wikimedia.org/wikipedia/commons/8/83/Equirectangular_projection_SW.jpg")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.7
      }}>
        {/* Station Markers */}
        {stations.map((station) => {
          const { x, y } = getMarkerPosition(station.latitude, station.longitude);
          const isSelected = selectedStation?.stationId === station.stationId;
          
          return (
            <div 
              key={station.stationId}
              className="absolute cursor-pointer group hover:z-10 transition-transform hover:scale-110"
              style={{ left: `${x}%`, top: `${y}%` }}
              onClick={() => onSelectStation(station)}
            >
              <motion.div 
                className={`${isSelected ? 'bg-green-500 w-5 h-5' : 'bg-primary w-4 h-4'} rounded-full border-2 border-white shadow-md`}
                initial={{ scale: 0.8 }}
                animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                transition={{ 
                  duration: 0.5,
                  repeat: isSelected ? Infinity : 0,
                  repeatType: "reverse"
                }}
              />
              <div className="hidden group-hover:block absolute top-full mt-1 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded shadow-lg text-xs whitespace-nowrap z-10">
                {station.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
