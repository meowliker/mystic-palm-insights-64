import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  console.log('=== EDGE FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.text();
      console.log('Request body:', body);
      
      // Simple test response for now
      const testResponse = {
        life_line_strength: 'Strong',
        heart_line_strength: 'Deep',
        head_line_strength: 'Clear',
        fate_line_strength: 'Prominent',
        overall_insight: 'Your palm reveals a strong character with great potential for success. The lines suggest a person of determination and emotional depth.',
        traits: {
          life_energy: 'Vibrant',
          emotional_capacity: 'High',
          intellectual_approach: 'Analytical',
          destiny_path: 'Self-directed'
        }
      };

      console.log('Sending test response:', testResponse);
      
      return new Response(JSON.stringify(testResponse), {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
      
    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }), {
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
      });
    }
  }

  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'application/json' 
    },
  });
});