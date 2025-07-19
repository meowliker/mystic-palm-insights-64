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
  if (!openaiApiKey) {
    console.error('OpenAI API key not found - falling back to simulated analysis');
    return generateSimulatedPalmAnalysis();
  }

  console.log('Starting palm image analysis for URL:', imageUrl);

  try {
    console.log('Calling OpenAI for comprehensive palm analysis...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are a master palmist with decades of experience in traditional palmistry and astrological sciences. You combine ancient wisdom with intuitive insights to provide comprehensive palm readings.

IMPORTANT: Based on the palm image provided, give a detailed palmistry reading following traditional palmistry principles. Analyze what you can actually observe in the image.

Provide specific insights about:
- Life Line: vitality, health, life journey, strength and clarity
- Heart Line: emotions, relationships, love capacity, depth and characteristics  
- Head Line: intellect, mental approach, creativity, length and curve
- Fate Line: destiny, career path, external influences, presence and definition
- Character traits and personality insights based on observable features
- Palm mounts, finger characteristics, and overall hand shape if visible

Be authentic to traditional palmistry while being insightful and personal. Focus on what you can actually see in the palm image and provide meaningful interpretations based on those observations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this palm image and provide a comprehensive palmistry reading. Focus on the palm lines, mounts, and any other observable features. Give detailed insights about the person\'s character, destiny, and life path according to traditional palmistry principles.'
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
      console.error('OpenAI API error:', response.status, await response.text());
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const palmAnalysis = data.choices[0]?.message?.content || '';
    console.log('OpenAI palm analysis received:', palmAnalysis.substring(0, 200) + '...');

    return palmAnalysis;
    
  } catch (error) {
    console.error('Error in palm analysis:', error);
    // Fallback to simulated analysis
    return generateSimulatedPalmAnalysis();
  }
};

const generateSimulatedPalmAnalysis = () => {
  const analyses = [
    `Your palm reveals fascinating insights about your unique character and life path. The life line shows strong vitality and a dynamic approach to life's challenges, curving gracefully around the thumb mount indicating natural resilience. Your heart line displays deep emotional capacity with clear definition, suggesting you form meaningful relationships and have strong intuitive abilities. The head line shows excellent mental clarity and analytical thinking, running clearly across the palm indicating balanced decision-making skills. Your fate line is well-defined, pointing to a strong sense of purpose and the ability to shape your own destiny through determined effort.`,
    
    `The palm analysis reveals a remarkable balance of emotional depth and intellectual strength. Your life line shows robust health and vitality, with its strong curve indicating adaptability in life's journey. The heart line demonstrates significant emotional intelligence and capacity for deep connections, while maintaining healthy boundaries. Your head line suggests creative problem-solving abilities combined with practical wisdom. The fate line indicates periods of self-directed growth and opportunities for leadership roles. Overall, your palm suggests someone who combines intuition with logic, creating a harmonious approach to life's opportunities and challenges.`,
    
    `Your palm displays the characteristics of someone with natural leadership qualities and strong personal magnetism. The life line shows sustained energy throughout life with particular strength in creative endeavors. Your heart line reveals passionate nature balanced with emotional wisdom, indicating fulfilling relationships both personal and professional. The head line demonstrates innovative thinking and the ability to see solutions others might miss. Your fate line suggests a path of gradual but steady achievement, with major positive changes occurring through your own initiative and determination.`
  ];
  
  return analyses[Math.floor(Math.random() * analyses.length)];
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
    
    const { palmImageUrl, zodiacSign, name, birthDate, birthTime, birthPlace, method } = JSON.parse(requestBody);
    
    // Check if this is a palm reading request or horoscope request
    if (palmImageUrl) {
      console.log('Processing palm reading request with image:', palmImageUrl);
      
      // Analyze the palm image using OpenAI
      const aiAnalysis = await analyzePalmImage(palmImageUrl);
      console.log('AI Analysis result:', aiAnalysis);
      
      // Parse the AI response into structured palm reading data
      const palmReading = parsePalmReading(aiAnalysis);
      console.log('Parsed palm reading:', palmReading);
      
      // Save the palm reading to database
      const authHeader = req.headers.get('authorization');
      const userIdHeader = req.headers.get('user-id');
      
      console.log('Auth header:', authHeader);
      console.log('User-ID header:', userIdHeader);
      
      const userIdFromAuth = userIdHeader || 'anonymous';
      
      console.log('Attempting to save palm reading for user:', userIdFromAuth);
      
      try {
        const { data: savedReading, error: saveError } = await supabase
          .from('palm_scans')
          .insert({
            user_id: userIdFromAuth, 
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
        } else {
          console.log('Palm reading saved successfully:', savedReading?.id);
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
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