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

    // For each keyword, generate comprehensive information using AI
    const keywordsWithInfo = await Promise.all(
      keywords.slice(0, 15).map(async (keyword) => {
        try {
          console.log(`Generating info for keyword: ${keyword}`);
          
          // Use AI to generate detailed definition and related info
          const infoResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                  content: "You are an expert educator creating glossary entries for space weather and related scientific terms. Provide comprehensive but concise definitions suitable for educational purposes. Include practical examples when relevant. Return information in both English and Portuguese when possible."
                },
                {
                  role: "user",
                  content: `Create a detailed educational definition for the term: "${keyword}". Include: 1) Clear definition (2-3 sentences), 2) Category/field of study, 3) Real-world applications or examples if applicable. Format as JSON.`
                }
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "create_glossary_entry",
                    description: "Create a comprehensive glossary entry for a scientific term",
                    parameters: {
                      type: "object",
                      properties: {
                        term: { type: "string", description: "The term being defined" },
                        definition: { type: "string", description: "Clear, concise definition (2-3 sentences)" },
                        category: { type: "string", description: "Scientific category or field" },
                        example: { type: "string", description: "Real-world example or application" },
                        relatedTerms: { 
                          type: "array", 
                          items: { type: "string" },
                          description: "Related scientific terms"
                        }
                      },
                      required: ["term", "definition", "category"],
                      additionalProperties: false
                    }
                  }
                }
              ],
              tool_choice: { type: "function", function: { name: "create_glossary_entry" } }
            }),
          });

          let termInfo = null;
          
          if (infoResponse.ok) {
            const infoData = await infoResponse.json();
            if (infoData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
              termInfo = JSON.parse(infoData.choices[0].message.tool_calls[0].function.arguments);
            }
          }

        // Try to find NASA data or related content
        let nasaData = null;
        try {
          const nasaSearchUrl = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&count=1`;
          const nasaResponse = await fetch(nasaSearchUrl);
          if (nasaResponse.ok) {
            const data = await nasaResponse.json();
            nasaData = data[0];
          }
        } catch (e) {
          console.log(`No NASA data for ${keyword}`);
        }

        return {
          keyword,
          definition: termInfo?.definition || `Scientific term related to ${keyword}`,
          category: termInfo?.category || "Science",
          example: termInfo?.example || null,
          relatedTerms: termInfo?.relatedTerms || [],
          hasNasaInfo: !!nasaData,
          nasaData: nasaData
        };
      } catch (error) {
        console.error(`Error generating info for keyword "${keyword}":`, error);
        return {
          keyword,
          definition: `Scientific term: ${keyword}`,
          category: "General",
          example: null,
          relatedTerms: [],
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
