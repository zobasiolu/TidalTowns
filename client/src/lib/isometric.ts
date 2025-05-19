// Create an isometric grid with the specified width and height
export function createIsometricGrid(width: number, height: number) {
  const grid: { x: number; y: number }[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      grid.push({ x, y });
    }
  }
  
  return grid;
}

// Convert grid position to screen coordinates
export function positionToCoords(x: number, y: number, cellSize = 64) {
  // For isometric projection
  // These calculations create the isometric effect where:
  // - x increases rightward and y increases downward in the grid
  // - But on screen, x+y moves southeast and x-y moves northeast
  
  // Center position and apply isometric transforms
  const baseX = 50; // Center horizontally at 50%
  const baseY = 50; // Center vertically at 50%
  
  // Scale factor to adjust the grid spacing
  const scaleFactor = cellSize / 128; // Adjust this to change the spacing
  
  // Apply isometric projection
  const isoX = (x - y) * scaleFactor;
  const isoY = (x + y) * scaleFactor * 0.5; // 0.5 to flatten the vertical dimension
  
  // Return the final percentages for positioning
  return {
    left: baseX + isoX,
    top: baseY + isoY
  };
}

// Convert screen coordinates back to grid position
export function coordsToPosition(screenX: number, screenY: number, containerWidth: number, containerHeight: number) {
  // These calculations need to undo the isometric transform
  // Get position relative to container center
  const centerX = containerWidth / 2;
  const centerY = containerHeight / 2;
  
  // Get coordinates relative to center
  const relX = screenX - centerX;
  const relY = screenY - centerY;
  
  // Convert back from isometric
  const tileWidth = 64;
  const tileHeight = 32; // Half of width for isometric
  
  // Isometric to cartesian transformation
  const cartX = (relX / tileWidth + relY / tileHeight) / 2;
  const cartY = (relY / tileHeight - relX / tileWidth) / 2;
  
  return {
    x: Math.round(cartX),
    y: Math.round(cartY)
  };
}

// Check if a point is inside a grid cell
export function isPointInCell(
  pointX: number, 
  pointY: number, 
  cellX: number, 
  cellY: number, 
  cellSize = 64
) {
  const { left, top } = positionToCoords(cellX, cellY, cellSize);
  const halfSize = cellSize / 2;
  
  // Simple bounding box check 
  // (for more accurate isometric check, would need to use diamond shape)
  return (
    pointX >= left - halfSize &&
    pointX <= left + halfSize &&
    pointY >= top - halfSize &&
    pointY <= top + halfSize
  );
}
