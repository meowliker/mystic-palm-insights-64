import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY');
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
  if (!deepseekApiKey) {
    throw new Error('DeepSeek API key not found');
  }

  const palmAnalysisPrompt = `You are a professional palmist with decades of experience. Analyze this palm image in detail and provide a comprehensive reading following traditional palmistry principles.

Focus on these key elements:

1. **Life Line Analysis**: Examine the curve, depth, length, and any breaks or islands. What does this reveal about vitality, health, and life journey?

2. **Heart Line Analysis**: Study the line's path, depth, and clarity. What does this indicate about emotional capacity, relationships, and love life?

3. **Head Line Analysis**: Analyze the line's direction, length, and strength. What does this suggest about intellect, reasoning, creativity, and mental approach?

4. **Fate Line Analysis**: Look for the presence, clarity, and path of the fate line. What does this reveal about destiny, career path, and external influences?

5. **Palm Mounts**: Examine the mounts of Venus, Mars, Moon, etc. What do their prominence or flatness indicate?

6. **Hand Shape & Fingers**: Consider overall hand shape, finger lengths, and proportions for additional character insights.

7. **Additional Markings**: Note any crosses, stars, triangles, or other significant markings.

Provide specific, detailed insights for each palm line strength (Strong/Moderate/Weak) and overall character traits. Be authentic to palmistry tradition while being insightful and personal.

Format your response as a detailed analysis that can be parsed into structured data.`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: palmAnalysisPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this palm image and provide a detailed palmistry reading.'
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

    if (!response.ok) {
      console.error('DeepSeek API error:', response.status, await response.text());
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { palmImageUrl, zodiacSign, name, birthDate, birthTime, birthPlace, method } = await req.json();
    
    // Check if this is a palm reading request or horoscope request
    if (palmImageUrl) {
      console.log('Processing palm reading request with image:', palmImageUrl);
      
      // Analyze the palm image using DeepSeek AI
      const aiAnalysis = await analyzePalmImage(palmImageUrl);
      console.log('AI Analysis result:', aiAnalysis);
      
      // Parse the AI response into structured palm reading data
      const palmReading = parsePalmReading(aiAnalysis);
      console.log('Parsed palm reading:', palmReading);
      
      // Save the palm reading to database
      const { data: savedReading, error: saveError } = await supabase
        .from('palm_scans')
        .insert({
          user_id: req.headers.get('user-id'), // This should be passed from the client
          life_line_strength: palmReading.life_line_strength,
          heart_line_strength: palmReading.heart_line_strength,
          head_line_strength: palmReading.head_line_strength,
          fate_line_strength: palmReading.fate_line_strength,
          overall_insight: palmReading.overall_insight,
          traits: palmReading.traits,
          palm_image_url: palmImageUrl
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving palm reading:', saveError);
        // Continue anyway, don't fail the request
      }

      return new Response(JSON.stringify(palmReading), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle horoscope generation (existing functionality)
    let finalZodiacSign = zodiacSign;
    
    // Calculate zodiac sign from birth details if method is 'calculate'
    if (method === 'calculate' && birthDate) {
      const date = new Date(birthDate);
      const day = date.getDate();
      const month = date.getMonth() + 1;
      finalZodiacSign = calculateZodiacSign(day, month);
    }

    if (!finalZodiacSign) {
      throw new Error('Zodiac sign is required');
    }

    const signInfo = zodiacSigns[finalZodiacSign as keyof typeof zodiacSigns];

    // Generate horoscope with predefined content
    const predictions = [
      `Today brings exciting opportunities for ${finalZodiacSign}s to shine. Your ${signInfo.element} energy is particularly strong, making this an ideal time for new beginnings.`,
      `The cosmic alignment favors ${finalZodiacSign}s today. With ${signInfo.planet} as your guide, trust your intuition and embrace the changes coming your way.`,
      `Your ${signInfo.element} nature will serve you well today. As a ${finalZodiacSign}, you're entering a period of growth and positive transformation.`,
      `The stars align in your favor today, dear ${finalZodiacSign}. Your ruling planet ${signInfo.planet} encourages you to step boldly into new opportunities.`
    ];

    const focusAreas = [
      'Career, Love, Health',
      'Relationships, Creativity, Finances',
      'Personal Growth, Communication, Wellness',
      'Family, Goals, Self-care',
      'Adventure, Learning, Balance'
    ];

    const colors = ['Blue', 'Green', 'Purple', 'Gold', 'Silver', 'Orange', 'Pink', 'Turquoise'];
    
    const advice = [
      'Trust your inner wisdom today.',
      'Embrace new opportunities with confidence.',
      'Listen to your heart and follow your dreams.',
      'Stay positive and keep moving forward.',
      'Balance is key to your success today.'
    ];

    const horoscopeData = {
      prediction: predictions[Math.floor(Math.random() * predictions.length)],
      energy: Math.floor(Math.random() * 30) + 70, // 70-100%
      focus: focusAreas[Math.floor(Math.random() * focusAreas.length)],
      luckyColor: colors[Math.floor(Math.random() * colors.length)],
      advice: advice[Math.floor(Math.random() * advice.length)],
      sign: finalZodiacSign.charAt(0).toUpperCase() + finalZodiacSign.slice(1),
      calculatedSign: method === 'calculate' ? finalZodiacSign : null,
      signInfo: signInfo
    };

    return new Response(JSON.stringify(horoscopeData), {
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