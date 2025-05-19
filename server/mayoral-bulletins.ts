import OpenAI from "openai";
import { TideData, StormEvent } from '@shared/schema';
import { log } from './vite';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate a mayoral news bulletin based on tide data and city state
export async function generateMayoralBulletin(
  tideData: TideData[],
  cityName: string,
  stationName: string,
  resources: { fish: number; tourism: number; energy: number },
  buildingCounts: Record<string, number>,
  stormEvent?: StormEvent
): Promise<{ title: string; message: string }> {
  try {
    // If we don't have an API key, return a default message
    if (!process.env.OPENAI_API_KEY) {
      return {
        title: "Mayoral Update",
        message: `Citizens of ${cityName}, our tide conditions are changing! Monitor our resources carefully.`
      };
    }

    // Find the highest and lowest tides to mention
    const highestTide = [...tideData]
      .filter(td => td.type === 'H')
      .sort((a, b) => b.height - a.height)[0];
    
    const lowestTide = [...tideData]
      .filter(td => td.type === 'L')
      .sort((a, b) => a.height - b.height)[0];

    // Create the context for OpenAI
    const context = {
      cityName,
      stationName,
      resources,
      buildings: buildingCounts,
      highestTide: highestTide ? { 
        height: highestTide.height.toFixed(1),
        time: new Date(highestTide.timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true
        })
      } : null,
      lowestTide: lowestTide ? {
        height: lowestTide.height.toFixed(1),
        time: new Date(lowestTide.timestamp).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true
        })
      } : null,
      stormEvent: stormEvent ? {
        title: stormEvent.title,
        severity: stormEvent.severity,
        description: stormEvent.description
      } : null
    };

    // Determine the tone based on situation
    let tone = "informative";
    if (stormEvent) {
      tone = "concerned";
    } else if (highestTide && highestTide.height > 5) {
      tone = "excited"; // Exceptional high tide will boost fishing
    } else if (lowestTide && lowestTide.height < 1) {
      tone = "optimistic"; // Very low tide will boost tourism
    }

    // Generate the bulletin using OpenAI
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a coastal city mayor who provides updates about tide conditions and their impact on the city. 
                    Your tone is ${tone}. The city's economy is based on fishing (boosted by high tides) and tourism (boosted by low tides).
                    Respond with JSON containing a brief title (under 40 chars) and a message (under 200 words).`
        },
        {
          role: "user",
          content: `Generate a mayoral bulletin for the citizens of ${cityName} based on this data:
                    ${JSON.stringify(context, null, 2)}`
        }
      ],
      response_format: { type: "json_object" }
    });

    // Parse the response
    const result = JSON.parse(response.choices[0].message.content);
    
    return {
      title: result.title || "Mayoral Update",
      message: result.message || `Citizens of ${cityName}, our tide conditions are changing! Monitor our resources carefully.`
    };
  } catch (error) {
    log(`Error generating mayoral bulletin: ${error}`, 'openai');
    
    // Fallback message if OpenAI fails
    return {
      title: "Mayoral Update",
      message: `Citizens of ${cityName}, our tide conditions continue to affect our city's productivity. Please check the tide schedule and adjust your activities accordingly.`
    };
  }
}
