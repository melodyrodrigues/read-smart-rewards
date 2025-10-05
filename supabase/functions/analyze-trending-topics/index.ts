import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { spaceWeatherData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Create a summary of the space weather data
    const dataSummary = `
NASA DONKI Data:
- Solar Flares: ${spaceWeatherData.solarFlares?.count || 0} events in the last 30 days
- Most recent flare: ${spaceWeatherData.solarFlares?.recent?.[0]?.class || 'N/A'} class
- Coronal Mass Ejections (CME): ${spaceWeatherData.coronalMassEjections?.count || 0} events
- Average CME speed: ${spaceWeatherData.coronalMassEjections?.recent?.[0]?.speed || 'N/A'} km/s
- Geomagnetic Storms: ${spaceWeatherData.geomagneticStorms?.count || 0} events
- Latest Kp Index: ${spaceWeatherData.geomagneticStorms?.recent?.[0]?.kpIndex || 'N/A'}
- Total Notifications: ${spaceWeatherData.notifications?.count || 0}
`;

    const systemPrompt = `You are an expert space weather analyst with access to both NASA DONKI data and current web information about space weather.

Your task: Identify 5 REAL trending topics in space weather that are currently being discussed. Use a combination of:
1. The NASA DONKI data provided (solar flares, CMEs, geomagnetic storms)
2. Your knowledge of current space weather events and trends
3. Real, verifiable URLs from trusted sources

For each topic:
1. Title: Engaging title (in English) that reflects actual current events
2. Description: Brief, informative description (2-3 sentences in English) based on real data
3. Category: "solar", "magnetosphere", "radiation", "aurora", or "cosmic"
4. Relevance: Score (1-100) based on current activity levels and public interest
5. URL: MUST be a REAL, working URL from these trusted sources:
   - https://www.spaceweather.com/ - current space weather news
   - https://www.swpc.noaa.gov/ - official NOAA forecasts
   - https://science.nasa.gov/heliophysics/ - NASA heliophysics
   - https://www.space.com/news/space-weather - space weather news
   - https://www.esa.int/Science_Exploration/Space_Science/ - ESA space science

CRITICAL RULES FOR URLS:
- Use main section URLs, not specific article URLs (e.g., use "https://www.spaceweather.com/" not "https://www.spaceweather.com/article/12345")
- Match URL to topic category:
  * Solar flare topics → "https://www.spaceweather.com/" or "https://www.swpc.noaa.gov/"
  * Aurora topics → "https://www.spaceweather.com/"
  * CME topics → "https://www.swpc.noaa.gov/" or "https://science.nasa.gov/heliophysics/"
  * Geomagnetic storm topics → "https://www.swpc.noaa.gov/"
  * General space science → "https://www.space.com/news/space-weather"

Base your topics on the actual NASA data provided - if solar flare activity is high, make that trending. If there are many CMEs, highlight that.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this NASA space weather data and generate 5 trending topics with REAL, working URLs:\n\n${dataSummary}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_trending_topics",
            description: "Generate 5 trending space weather topics based on NASA data",
            parameters: {
              type: "object",
              properties: {
                topics: {
                  type: "array",
                  items: {
                    type: "object",
                  properties: {
                    title: { type: "string", description: "Engaging title in English" },
                    description: { type: "string", description: "Brief description in English" },
                      category: { 
                        type: "string", 
                        enum: ["solar", "magnetosphere", "radiation", "aurora", "cosmic"],
                        description: "Topic category"
                      },
                      relevance: { 
                        type: "number", 
                        description: "Relevance score 1-100 based on current data",
                        minimum: 1,
                        maximum: 100
                      },
                      nasaUrl: { 
                        type: "string", 
                        description: "REAL working URL - use main section URLs only (e.g., https://www.spaceweather.com/, https://www.swpc.noaa.gov/, https://science.nasa.gov/heliophysics/, https://www.space.com/news/space-weather). Must match the topic category."
                      }
                    },
                    required: ["title", "description", "category", "relevance", "nasaUrl"],
                    additionalProperties: false
                  },
                  minItems: 5,
                  maxItems: 5
                }
              },
              required: ["topics"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_trending_topics" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response:", JSON.stringify(aiResponse, null, 2));

    // Extract the function call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const topics = JSON.parse(toolCall.function.arguments).topics;

    return new Response(
      JSON.stringify({ topics }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Error in analyze-trending-topics:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        } 
      }
    );
  }
});
