import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { palmArea, description } = await req.json();

    if (!palmArea) {
      throw new Error('Palm area is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a detailed prompt for palm illustration
    const prompt = `Create a clear, educational illustration of a human palm showing the ${palmArea}. The illustration should:
    - Show a realistic human palm from above
    - Clearly highlight the ${palmArea} with a bright red or golden line
    - Have a clean, educational style like a medical or astrology textbook
    - Include subtle labels or arrows pointing to the highlighted area
    - Use soft, mystical colors with a cosmic background
    - Make the highlighted line very visible and distinct
    - Style: Educational palmistry illustration, mystical, cosmic theme
    ${description ? `Additional context: ${description}` : ''}`;

    console.log('Generating palm illustration for:', palmArea);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const imageUrl = data.data[0].url;

    console.log('Generated palm illustration successfully');

    return new Response(JSON.stringify({ 
      imageUrl,
      palmArea,
      description 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-palm-illustration function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      palmArea: null,
      imageUrl: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});