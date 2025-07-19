import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

const analyzePalmImage = async (imageUrl: string, rightImageUrl?: string) => {
  console.log('Starting palm image analysis for URL:', imageUrl);
  if (rightImageUrl) {
    console.log('Dual palm analysis - right palm URL:', rightImageUrl);
  }
  console.log('OpenAI API Key available:', !!openaiApiKey);
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  // Determine if this is dual palm analysis
  const isDualPalm = !!rightImageUrl;

  try {
    console.log('Calling OpenAI for comprehensive palm analysis...');
    
    let messages;
    
    if (isDualPalm) {
      messages = [
        {
          role: 'system',
          content: `You are a master palmist with decades of experience in traditional palmistry and astrological sciences. You combine ancient wisdom with intuitive insights to provide comprehensive palm readings.

IMPORTANT: You are analyzing BOTH palms (left and right hands). Compare and synthesize the readings from both hands to provide a unified, comprehensive analysis.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze these TWO palm photos (left and right hands) and provide a comprehensive combined palm reading. Compare the lines between both hands and provide a unified analysis:

DUAL PALM ANALYSIS:

Life Line (both hands):
- Compare strength and depth between hands
- What does the combination suggest about vitality, overall life journey, and health?

Heart Line (both hands):
- Compare emotional patterns shown in each hand
- What does this reveal about emotional depth, relationships, and capacity for love?

Head Line (both hands):
- Compare intellectual indicators between hands
- How do they indicate decision-making processes, mental clarity, and thinking patterns?

Fate Line (both hands):
- Compare presence and strength in each hand
- What does this suggest about destiny, career path, and life direction?

Dominant vs Non-Dominant Hand:
- Note differences between the hands and what they reveal
- How do they show conscious vs subconscious traits?

Synthesis:
- Provide an overall personality analysis combining insights from both palms
- Give character traits and future insights based on the complete reading

Focus on creating a unified reading that takes advantage of having both palms to provide deeper, more accurate insights.`
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl
              }
            },
            {
              type: 'image_url',
              image_url: {
                url: rightImageUrl
              }
            }
          ]
        }
      ];
    } else {
      messages = [
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
      ];
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages,
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
    console.log('OpenAI response received, analyzing...');
    
    const palmAnalysis = data.choices?.[0]?.message?.content || '';
    
    if (!palmAnalysis) {
      console.error('No analysis content in OpenAI response');
      throw new Error('No analysis content received from OpenAI');
    }
    
    console.log('Palm analysis completed successfully');
    return palmAnalysis;
    
  } catch (error) {
    console.error('Error in palm analysis:', error);
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
  console.log('=== EDGE FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
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
      console.log('Request body received');
      
      // Parse request body
      const { zodiacSign, name, birthDate, birthTime, birthPlace, method, palmImageUrl, rightPalmImageUrl, analysisType } = JSON.parse(body);
      
      // Check if this is a palm reading request
      if (palmImageUrl) {
        console.log('Processing palm reading request with AI analysis...');
        
        // Analyze the palm image(s) using OpenAI's vision API
        const aiAnalysis = await analyzePalmImage(palmImageUrl, rightPalmImageUrl);
        console.log('AI Analysis completed successfully');
        
        // Parse the AI response into structured palm reading data
        const palmReading = parsePalmReading(aiAnalysis);
        console.log('Palm reading parsed successfully');
        
        // Save the palm reading to database
        const userIdHeader = req.headers.get('user-id');
        const userIdFromAuth = userIdHeader || 'anonymous';
        
        console.log('Saving palm reading to database for user:', userIdFromAuth);
        
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
              palm_image_url: palmImageUrl,
              right_palm_image_url: rightPalmImageUrl || null
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