import { Card, CardContent } from "@/components/ui/card";
import { Building, BuildingType } from "@shared/schema";
import { getBuildingIcon } from "@/lib/buildings";

interface BuildingsSummaryProps {
  buildings: (Building & { type: BuildingType })[];
}

export default function BuildingsSummary({ buildings }: BuildingsSummaryProps) {
  // Count buildings by type
  const buildingCounts: Record<string, number> = {};
  
  buildings.forEach(building => {
    const type = building.type.type;
    buildingCounts[type] = (buildingCounts[type] || 0) + 1;
  });
  
  // Get unique building types to display
  const uniqueTypes = buildings
    .map(b => b.type)
    .filter((type, index, self) => 
      index === self.findIndex(t => t.type === type.type)
    );
    
  // Sort building types by count (descending)
  uniqueTypes.sort((a, b) => 
    (buildingCounts[b.type] || 0) - (buildingCounts[a.type] || 0)
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-heading font-medium text-lg mb-3">City Buildings</h3>
        <div className="space-y-2">
          {uniqueTypes.length === 0 ? (
            <p className="text-gray-500 text-sm">No buildings constructed yet.</p>
          ) : (
            uniqueTypes.map((type) => {
              const Icon = getBuildingIcon(type.type);
              const count = buildingCounts[type.type] || 0;
              
              // Determine the color based on building type
              let iconColor;
              switch(type.type) {
                case 'fishing_dock': iconColor = 'text-fishing'; break;
                case 'beach_resort': iconColor = 'text-tourism'; break;
                case 'lighthouse': iconColor = 'text-primary'; break;
                case 'power_plant': iconColor = 'text-energy'; break;
                default: iconColor = 'text-gray-700';
              }
              
              return (
                <div key={type.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex items-center">
                    <Icon className={`${iconColor} mr-2 h-4 w-4`} />
                    <span>{type.name}</span>
                  </div>
                  <span className="font-medium">{count}</span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
