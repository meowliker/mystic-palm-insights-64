import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { zodiacSign, name, birthDate, birthTime, birthPlace, method } = await req.json();
    
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
    const todayDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const prompt = `Generate a personalized daily horoscope for ${todayDate} for a ${finalZodiacSign} person${name ? ` named ${name}` : ''}. 

    Consider these astrological details:
    - Sign: ${finalZodiacSign.charAt(0).toUpperCase() + finalZodiacSign.slice(1)}
    - Element: ${signInfo.element}
    - Ruling Planet: ${signInfo.planet}
    ${birthTime ? `- Birth Time: ${birthTime}` : ''}
    ${birthPlace ? `- Birth Place: ${birthPlace}` : ''}

    Provide:
    1. A meaningful daily prediction (2-3 sentences) focused on practical guidance
    2. An energy level percentage (1-100)
    3. 2-3 key focus areas for the day (comma-separated, like "Career, Love, Health")
    4. A lucky color for the day
    5. A piece of cosmic advice (1 sentence)

    Format the response as a JSON object with these keys:
    - prediction: string
    - energy: number (1-100)
    - focus: string (comma-separated areas)
    - luckyColor: string
    - advice: string
    - sign: string (capitalized sign name)

    Make it personal, positive, and actionable.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a professional astrologer with deep knowledge of zodiac signs, planetary influences, and cosmic energies. Provide thoughtful, personalized horoscope readings that blend traditional astrology with practical life guidance.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to generate horoscope');
    }

    const generatedContent = data.choices[0].message.content;
    
    try {
      const horoscopeData = JSON.parse(generatedContent);
      
      // Add calculated zodiac sign info
      horoscopeData.calculatedSign = method === 'calculate' ? finalZodiacSign : null;
      horoscopeData.signInfo = signInfo;
      
      return new Response(JSON.stringify(horoscopeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (parseError) {
      // Fallback if JSON parsing fails
      return new Response(JSON.stringify({
        prediction: generatedContent,
        energy: Math.floor(Math.random() * 30) + 70,
        focus: "Personal Growth, Reflection",
        luckyColor: "Blue",
        advice: "Trust your intuition today.",
        sign: finalZodiacSign.charAt(0).toUpperCase() + finalZodiacSign.slice(1),
        signInfo: signInfo
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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