import { Card, CardContent } from "@/components/ui/card";
import { TideData } from "@shared/schema";
import { format } from "date-fns";

interface TideHistoryProps {
  tideHistory: TideData[];
}

export default function TideHistory({ tideHistory }: TideHistoryProps) {
  // Process and organize the tide history data
  // Group by date and find daily high and low tide values
  const processedData = tideHistory.reduce((acc: Record<string, any>, tide) => {
    const date = format(new Date(tide.timestamp), 'MMM dd');
    
    if (!acc[date]) {
      acc[date] = {
        date,
        highTide: { height: -Infinity, time: null },
        lowTide: { height: Infinity, time: null }
      };
    }
    
    // Track highest tide for the day
    if (tide.height > acc[date].highTide.height) {
      acc[date].highTide = {
        height: tide.height,
        time: format(new Date(tide.timestamp), 'h:mm a')
      };
    }
    
    // Track lowest tide for the day
    if (tide.height < acc[date].lowTide.height) {
      acc[date].lowTide = {
        height: tide.height,
        time: format(new Date(tide.timestamp), 'h:mm a')
      };
    }
    
    return acc;
  }, {});
  
  // Convert to array and sort by date (newest first)
  const sortedData = Object.values(processedData).sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime(); // newest first
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-heading font-medium text-lg mb-3">Tide History (7 Days)</h3>
        <div className="overflow-x-auto">
          {sortedData.length === 0 ? (
            <p className="text-gray-500 text-sm">No tide history available yet.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 px-3 text-left">Date</th>
                  <th className="py-2 px-3 text-left">High Tide</th>
                  <th className="py-2 px-3 text-left">Low Tide</th>
                  <th className="py-2 px-3 text-left">Variance</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.slice(0, 7).map((day, index) => {
                  const highTideDisplay = day.highTide.height > -Infinity 
                    ? `${day.highTide.height.toFixed(1)} ft (${day.highTide.time})`
                    : 'N/A';
                    
                  const lowTideDisplay = day.lowTide.height < Infinity 
                    ? `${day.lowTide.height.toFixed(1)} ft (${day.lowTide.time})`
                    : 'N/A';
                    
                  const variance = day.highTide.height > -Infinity && day.lowTide.height < Infinity
                    ? (day.highTide.height - day.lowTide.height).toFixed(1)
                    : 'N/A';
                    
                  return (
                    <tr key={index} className={index < sortedData.length - 1 ? "border-b border-gray-100" : ""}>
                      <td className="py-2 px-3">{index === 0 ? "Today" : day.date}</td>
                      <td className="py-2 px-3">{highTideDisplay}</td>
                      <td className="py-2 px-3">{lowTideDisplay}</td>
                      <td className="py-2 px-3 text-primary font-medium">{variance} {variance !== 'N/A' && 'ft'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
