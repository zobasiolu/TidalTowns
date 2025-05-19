import { useState, useRef, useEffect } from "react";
import { createIsometricGrid, positionToCoords } from "@/lib/isometric";
import { Building, BuildingType } from "@shared/schema";
import { getBuildingIcon } from "@/lib/buildings";
import { motion, AnimatePresence } from "framer-motion";

interface IsometricViewProps {
  buildings: (Building & { type: BuildingType })[];
  selectedBuildingType: BuildingType | null;
  onPlaceBuilding: (x: number, y: number) => void;
  onRemoveBuilding: (buildingId: number) => void;
  isPlacingBuilding: boolean;
}

export default function IsometricView({
  buildings,
  selectedBuildingType,
  onPlaceBuilding,
  onRemoveBuilding,
  isPlacingBuilding
}: IsometricViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [grid, setGrid] = useState<{ x: number; y: number }[]>([]);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);
  const [placementMode, setPlacementMode] = useState(false);
  
  // Set up isometric grid
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create a 10x10 grid for our city
    const gridPositions = createIsometricGrid(10, 10);
    setGrid(gridPositions);
    
    // Set placement mode based on prop
    setPlacementMode(isPlacingBuilding);
  }, [isPlacingBuilding]);
  
  // Check if a position is occupied
  const isPositionOccupied = (x: number, y: number) => {
    return buildings.some(b => b.posX === x && b.posY === y);
  };
  
  // Handle grid cell click
  const handleGridCellClick = (x: number, y: number) => {
    if (placementMode) {
      if (!isPositionOccupied(x, y)) {
        onPlaceBuilding(x, y);
      }
    }
  };
  
  // Handle building click (for removal)
  const handleBuildingClick = (e: React.MouseEvent, buildingId: number) => {
    if (!placementMode) {
      e.stopPropagation();
      onRemoveBuilding(buildingId);
    }
  };

  // Get color for building based on type
  const getBuildingColor = (type: string) => {
    switch (type) {
      case 'fishing_dock': return 'bg-fishing';
      case 'beach_resort': return 'bg-tourism';
      case 'lighthouse': return 'bg-primary';
      case 'seawall': return 'bg-gray-400';
      case 'house': return 'bg-secondary';
      case 'power_plant': return 'bg-energy';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div 
        ref={containerRef}
        className="relative w-3/4 h-3/4" 
        style={{ perspective: "1000px" }}
      >
        {/* Background ocean */}
        <div className="absolute inset-0 water-animation opacity-50 rounded-xl"></div>
        
        {/* Isometric Grid */}
        <div 
          className="isometric-grid absolute inset-0" 
          style={{ 
            transform: "rotateX(60deg) rotateZ(-45deg)",
            transformStyle: "preserve-3d"
          }}
        >
          {/* Grid cells for placement */}
          {placementMode && grid.map((cell, index) => {
            const isOccupied = isPositionOccupied(cell.x, cell.y);
            const isHovered = hoverPosition?.x === cell.x && hoverPosition?.y === cell.y;
            const { left, top } = positionToCoords(cell.x, cell.y);
            
            return (
              <div 
                key={`grid-${index}`}
                className={`absolute w-16 h-16 ${isOccupied ? 'opacity-25' : 'opacity-50'} ${
                  isHovered && !isOccupied ? 'bg-green-200 border-2 border-green-400' : 'bg-blue-200 border border-blue-300'
                } transition-all cursor-pointer`}
                style={{ 
                  left: `${left}%`, 
                  top: `${top}%`,
                  transform: `translateZ(${isHovered ? 5 : 0}px)` 
                }}
                onClick={() => handleGridCellClick(cell.x, cell.y)}
                onMouseEnter={() => setHoverPosition(cell)}
                onMouseLeave={() => setHoverPosition(null)}
              />
            );
          })}
          
          {/* Buildings */}
          <AnimatePresence>
            {buildings.map((building) => {
              const { left, top } = positionToCoords(building.posX, building.posY);
              const Icon = getBuildingIcon(building.type.type);
              
              return (
                <motion.div
                  key={building.id}
                  className={`isometric-tile absolute ${getBuildingColor(building.type.type)} rounded-lg shadow-lg cursor-pointer hover:brightness-110`}
                  style={{ 
                    width: "64px",
                    height: "64px",
                    left: `${left}%`, 
                    top: `${top}%`
                  }}
                  onClick={(e) => handleBuildingClick(e, building.id)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <Icon className="h-8 w-8" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
