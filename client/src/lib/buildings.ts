import { 
  Ship, Hotel, Lighthouse, LayoutBottom, Home, BatteryCharging,
  type LucideIcon
} from "lucide-react";

// Function to get the appropriate icon for a building type
export function getBuildingIcon(buildingType: string): LucideIcon {
  switch (buildingType) {
    case 'fishing_dock':
      return Ship;
    case 'beach_resort':
      return Hotel;
    case 'lighthouse':
      return Lighthouse;
    case 'seawall':
      return LayoutBottom;
    case 'house':
      return Home;
    case 'power_plant':
      return BatteryCharging;
    default:
      // Default icon if type doesn't match
      return Home;
  }
}

// Convert building type to human-readable name
export function getBuildingName(buildingType: string): string {
  switch (buildingType) {
    case 'fishing_dock':
      return 'Fishing Dock';
    case 'beach_resort':
      return 'Beach Resort';
    case 'lighthouse':
      return 'Lighthouse';
    case 'seawall':
      return 'Seawall';
    case 'house':
      return 'House';
    case 'power_plant':
      return 'Power Plant';
    default:
      return 'Unknown Building';
  }
}

// Get building production description
export function getBuildingProductionDescription(buildingType: string): string {
  switch (buildingType) {
    case 'fishing_dock':
      return 'Produces fish. Production boosted during high tides.';
    case 'beach_resort':
      return 'Produces tourism. Production boosted during low tides.';
    case 'lighthouse':
      return 'Protects ships and produces some tourism.';
    case 'seawall':
      return 'Protects buildings from storm surges.';
    case 'house':
      return 'Houses citizens and generates some tourism.';
    case 'power_plant':
      return 'Generates energy for your city.';
    default:
      return '';
  }
}
