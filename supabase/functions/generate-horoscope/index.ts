import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const zodiacSigns = {
  aries: { dates: "March 21 - April 19", element: "Fire", planet: "Mars" },
  taurus: { dates: "April 20 - May 20", element: "Earth", planet: "Venus" },
  gemini: { dates: "May 21 - June 20", element: "Air", planet: "Mercury" },
  cancer: { dates: "June 21 - July 22", element: "Water", planet: "Moon" },
  leo: { dates: "July 23 - August 22", element: "Fire", planet: "Sun" },
  virgo: { dates: "August 23 - September 22", element: "Earth", planet: "Mercury" },
  libra: { dates: "September 23 - October 22", element: "Air", planet: "Venus" },
  scorpio: { dates: "October 23 - November 21", element: "Water", planet: "Pluto" },
  sagittarius: { dates: "November 22 - December 21", element: "Fire", planet: "Jupiter" },
  capricorn: { dates: "December 22 - January 19", element: "Earth", planet: "Saturn" },
  aquarius: { dates: "January 20 - February 18", element: "Air", planet: "Uranus" },
  pisces: { dates: "February 19 - March 20", element: "Water", planet: "Neptune" }
};

function calculateZodiacSign(day: number, month: number): string {
  const zodiacRanges = [
    { sign: 'capricorn', start: { month: 12, day: 22 }, end: { month: 12, day: 31 } },
    { sign: 'capricorn', start: { month: 1, day: 1 }, end: { month: 1, day: 19 } },
    { sign: 'aquarius', start: { month: 1, day: 20 }, end: { month: 2, day: 18 } },
    { sign: 'pisces', start: { month: 2, day: 19 }, end: { month: 3, day: 20 } },
    { sign: 'aries', start: { month: 3, day: 21 }, end: { month: 4, day: 19 } },
    { sign: 'taurus', start: { month: 4, day: 20 }, end: { month: 5, day: 20 } },
    { sign: 'gemini', start: { month: 5, day: 21 }, end: { month: 6, day: 20 } },
    { sign: 'cancer', start: { month: 6, day: 21 }, end: { month: 7, day: 22 } },
    { sign: 'leo', start: { month: 7, day: 23 }, end: { month: 8, day: 22 } },
    { sign: 'virgo', start: { month: 8, day: 23 }, end: { month: 9, day: 22 } },
    { sign: 'libra', start: { month: 9, day: 23 }, end: { month: 10, day: 22 } },
    { sign: 'scorpio', start: { month: 10, day: 23 }, end: { month: 11, day: 21 } },
    { sign: 'sagittarius', start: { month: 11, day: 22 }, end: { month: 12, day: 21 } }
  ];

  for (const range of zodiacRanges) {
    if (
      (month === range.start.month && day >= range.start.day) ||
      (month === range.end.month && day <= range.end.day)
    ) {
      return range.sign;
    }
  }
  return 'capricorn'; // fallback
}

const analyzePalmImage = async (imageUrl: string) => {
  console.log('Starting palm image analysis for URL:', imageUrl);
  console.log('OpenAI API Key available:', !!openaiApiKey);
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    console.log('Calling OpenAI for comprehensive palm analysis...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a master palmist with decades of experience in traditional palmistry and astrological sciences. You combine ancient wisdom with intuitive insights to provide comprehensive palm readings.

IMPORTANT: Based on the palm image provided, give a detailed palmistry reading following traditional palmistry principles. Analyze what you can actually observe in the image.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze the following palm photo and provide a detailed palm reading based on the visible lines and markings. Include interpretations for the following palm features:

Life Line:
- Is it strong or weak, deep or shallow?
- What does it suggest about the user's vitality, overall life journey, and potential health influences?

Heart Line:
- Is it deep, clear, or shallow?
- What does it reveal about the user's emotional depth, relationships, and capacity for love?

Head Line:
- Is it clear, fragmented, or straight?
- How does it indicate intellectual abilities, decision-making processes, and mental clarity?

Fate Line:
- Is it present or absent?
- If present, is it deep or faint? What does it suggest about destiny, career path, and external influences?

Additional Markings:
- Are there any notable markings such as crosses, stars, or other unique features?
- What might they signify in the user's life or future?

Mounts:
- Analyze the mounts at the base of the fingers (Venus, Mars, Jupiter, etc.) and how they relate to the user's personality traits.

Astrological Considerations:
Zodiac Sign Influence:
- Based on the user's zodiac sign, how do the palm's lines and features align with typical astrological traits?

Provide an overall personality analysis, character traits, and potential future insights based on the palm features observed in the photo.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:', errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('OpenAI response data keys:', Object.keys(data));
    
    const palmAnalysis = data.choices?.[0]?.message?.content || '';
    
    if (!palmAnalysis) {
      console.error('No analysis content in OpenAI response');
      throw new Error('No analysis content received from OpenAI');
    }
    
    console.log('OpenAI palm analysis received:', palmAnalysis.substring(0, 200) + '...');
    return palmAnalysis;
    
  } catch (error) {
    console.error('Error in palm analysis:', error);
    console.error('Error details:', error.message);
    throw error;
  }
};


const parsePalmReading = (aiResponse: string) => {
  // Extract key insights from AI response and structure them
  const response = aiResponse.toLowerCase();
  
  // Determine line strengths based on AI analysis
  const getLineStrength = (lineType: string) => {
    if (response.includes(`${lineType} line`) || response.includes(`${lineType}:`)) {
      if (response.includes('strong') || response.includes('deep') || response.includes('prominent') || response.includes('clear')) {
        return 'Strong';
      } else if (response.includes('weak') || response.includes('faint') || response.includes('shallow')) {
        return 'Weak';
      } else {
        return 'Moderate';
      }
    }
    return 'Moderate';
  };

  // Extract overall insight (first substantial paragraph)
  const sentences = aiResponse.split(/[.!?]+/).filter(s => s.trim().length > 50);
  const overallInsight = sentences.slice(0, 2).join('. ').trim() + '.';

  // Extract character traits based on analysis
  const traits = {
    life_energy: response.includes('vibrant') || response.includes('strong vitality') ? 'Vibrant' : 
                response.includes('low energy') || response.includes('weak vitality') ? 'Low' : 'Balanced',
    emotional_capacity: response.includes('high emotional') || response.includes('deep emotions') ? 'High' :
                       response.includes('reserved') || response.includes('guarded') ? 'Reserved' : 'Moderate',
    intellectual_approach: response.includes('analytical') || response.includes('logical') ? 'Analytical' :
                          response.includes('creative') || response.includes('artistic') ? 'Creative' : 'Practical',
    destiny_path: response.includes('self-directed') || response.includes('independent') ? 'Self-directed' :
                 response.includes('influenced by others') ? 'Guided by others' : 'Balanced'
  };

  return {
    life_line_strength: getLineStrength('life'),
    heart_line_strength: getLineStrength('heart'),
    head_line_strength: getLineStrength('head'),
    fate_line_strength: getLineStrength('fate'),
    overall_insight: overallInsight || 'Your palm reveals unique patterns that suggest a journey of personal growth and discovery ahead.',
    traits
  };
};

serve(async (req) => {
  // Log all incoming requests
  console.log('Request received:', req.method, req.url);
  console.log('Request headers:', Object.fromEntries(req.headers.entries()));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.text();
    console.log('Request body:', requestBody);
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    
    // Simple test response first
    if (req.method === 'POST') {
      console.log('POST request received successfully!');
      return new Response(JSON.stringify({ 
        test: 'success',
        life_line_strength: 'Strong',
        heart_line_strength: 'Deep',
        head_line_strength: 'Clear', 
        fate_line_strength: 'Prominent',
        overall_insight: 'This is a test response from the working edge function!',
        traits: {
          life_energy: 'Vibrant',
          emotional_capacity: 'High', 
          intellectual_approach: 'Analytical',
          destiny_path: 'Self-directed'
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Default response for other methods
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-horoscope function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate horoscope' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});