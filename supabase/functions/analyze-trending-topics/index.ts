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
Solar Flares: ${spaceWeatherData.solarFlares?.count || 0} events in the last 30 days
- Most recent: ${spaceWeatherData.solarFlares?.recent?.[0]?.class || 'N/A'} class flare

Coronal Mass Ejections (CME): ${spaceWeatherData.coronalMassEjections?.count || 0} events
- Average speed: ${spaceWeatherData.coronalMassEjections?.recent?.[0]?.speed || 'N/A'} km/s

Geomagnetic Storms: ${spaceWeatherData.geomagneticStorms?.count || 0} events
- Latest Kp Index: ${spaceWeatherData.geomagneticStorms?.recent?.[0]?.kpIndex || 'N/A'}

Total Notifications: ${spaceWeatherData.notifications?.count || 0}
`;

    const systemPrompt = `You are an expert space weather analyst. Based on real NASA data, identify 5 trending topics in space weather that would be most interesting and relevant to the general public. For each topic:
1. Give it an engaging title (in Portuguese)
2. Provide a brief, fascinating description (2-3 sentences in Portuguese)
3. Assign a category: "solar", "magnetosphere", "radiation", "aurora", or "cosmic"
4. Give it a relevance score (1-100) based on current activity
5. Suggest a relevant NASA resource URL

Focus on making the topics educational, engaging, and connected to current space weather conditions.`;

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
          { role: "user", content: `Analyze this NASA space weather data and generate 5 trending topics:\n\n${dataSummary}` }
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
                      title: { type: "string", description: "Engaging title in Portuguese" },
                      description: { type: "string", description: "Brief description in Portuguese" },
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
                        description: "Relevant NASA resource URL"
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
