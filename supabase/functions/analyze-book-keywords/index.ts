import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { bookContent, bookTitle, bookAuthor } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const NASA_API_KEY = Deno.env.get("NASA_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }
    
    if (!NASA_API_KEY) {
      throw new Error("NASA_API_KEY is not configured");
    }

    console.log(`Analyzing keywords for book: ${bookTitle}`);

    // Use Lovable AI to extract keywords
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert at extracting relevant keywords from text. Extract up to 20 most important and meaningful keywords from the provided book content. Focus on scientific terms, space-related concepts, and key themes. Return only the keywords as a JSON array of strings, no additional text."
          },
          {
            role: "user",
            content: `Extract keywords from this book:\nTitle: ${bookTitle}\nAuthor: ${bookAuthor || 'Unknown'}\nContent: ${bookContent?.substring(0, 5000) || 'No content available'}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_keywords",
              description: "Extract meaningful keywords from the book content",
              parameters: {
                type: "object",
                properties: {
                  keywords: {
                    type: "array",
                    items: {
                      type: "string"
                    },
                    description: "List of extracted keywords"
                  }
                },
                required: ["keywords"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_keywords" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Lovable AI error:", aiResponse.status, errorText);
      throw new Error(`AI extraction failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI Response:", JSON.stringify(aiData, null, 2));

    let keywords: string[] = [];
    
    // Extract keywords from tool call
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const args = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
      keywords = args.keywords || [];
    }

    console.log(`Extracted ${keywords.length} keywords:`, keywords);

    // For each keyword, search NASA API for related information
    const keywordsWithInfo = await Promise.all(
      keywords.slice(0, 15).map(async (keyword) => {
        try {
          // Search NASA API for the keyword
          const nasaSearchUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=1`;
          const response = await fetch(nasaSearchUrl);
          
          if (response.ok) {
            const data = await response.json();
            return {
              keyword,
              hasNasaInfo: true,
              nasaData: data[0] || null
            };
          }
          
          return {
            keyword,
            hasNasaInfo: false,
            nasaData: null
          };
        } catch (error) {
          console.error(`Error fetching NASA data for keyword "${keyword}":`, error);
          return {
            keyword,
            hasNasaInfo: false,
            nasaData: null
          };
        }
      })
    );

    console.log(`Successfully analyzed book with ${keywordsWithInfo.length} keywords`);

    return new Response(
      JSON.stringify({ 
        success: true,
        keywords: keywordsWithInfo
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error("Error in analyze-book-keywords:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
