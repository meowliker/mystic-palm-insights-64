import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  console.log('=== NEW PALM READING FUNCTION CALLED ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API Key available: true');
    
    const { leftImageUrl, rightImageUrl } = await req.json();
    console.log('Request received with image URLs:', { leftImageUrl, rightImageUrl });

    if (!leftImageUrl) {
      throw new Error('Left palm image URL is required');
    }

    // Download and convert images to base64
    console.log('Starting image downloads...');
    
    const downloadImage = async (url: string): Promise<string> => {
      console.log('Downloading:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        throw new Error(`Failed to download: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      console.log('Download successful, base64 length:', base64.length);
      return base64;
    };

    const leftBase64 = await downloadImage(leftImageUrl);
    const rightBase64 = rightImageUrl ? await downloadImage(rightImageUrl) : null;
    
    console.log('All images downloaded successfully');

    // Create OpenAI request
    const messages = [
      {
        role: 'system',
        content: 'You are a professional palmist. Analyze the palm image(s) and provide insights about the person\'s life lines, personality, and future. Be detailed but concise.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: rightBase64 ? 
              'Analyze both palm images (left and right hands) and provide a comprehensive palm reading covering life line, heart line, head line, and overall personality insights.' :
              'Analyze this palm image and provide a palm reading covering life line, heart line, head line, and overall personality insights.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${leftBase64}`
            }
          }
        ]
      }
    ];

    // Add right hand image if available
    if (rightBase64) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${rightBase64}`
        }
      });
    }

    console.log('Calling OpenAI API...');
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const analysis = data.choices?.[0]?.message?.content || '';
    
    if (!analysis) {
      throw new Error('No analysis content received');
    }

    console.log('Analysis completed successfully');

    // Return simplified palm reading structure
    const palmReading = {
      life_line_strength: 'Moderate',
      heart_line_strength: 'Strong', 
      head_line_strength: 'Moderate',
      fate_line_strength: 'Moderate',
      overall_insight: analysis.substring(0, 500) + '...',
      traits: {
        personality: 'Analytical and intuitive',
        strengths: 'Creative and determined',
        challenges: 'May overthink decisions'
      }
    };

    console.log('Palm reading processed successfully');

    return new Response(JSON.stringify(palmReading), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in palm reading function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Palm reading failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});