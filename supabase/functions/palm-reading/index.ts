import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('=== PALM READING FUNCTION CALLED ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Request received with image URL:', { imageUrl });

    if (!imageUrl) {
      throw new Error('Palm image URL is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Convert image to base64 (same approach as astrobot)
    console.log('Fetching image for base64 conversion:', imageUrl);
    
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const uint8Array = new Uint8Array(imageBuffer);
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    // Convert to base64 safely for large images
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const imageBase64 = btoa(binary);
    
    console.log('Image converted to base64, size:', imageBase64.length);

    // Enhanced palmistry analysis with age predictions, wealth analysis, and more
    const messages = [
      {
        role: "system",
        content: `You are a master palmistry expert who provides comprehensive palm readings with age-based predictions, wealth analysis, mount interpretations, and detailed line intersections.

ENHANCED PALM READING STRUCTURE:
Analyze the palm image and provide a comprehensive reading in exactly this JSON format:

{
  "overall_insight": "Detailed narrative analysis of the palm...",
  "age_predictions": {
    "early_life": "Predictions for ages 0-25 based on palm lines",
    "prime_years": "Predictions for ages 25-45 including career peaks and major life events",
    "maturity": "Predictions for ages 45-65 including wealth accumulation and major achievements",
    "later_life": "Predictions for ages 65+ including legacy and final life phases"
  },
  "wealth_analysis": {
    "financial_potential": "High/Medium/Low with explanation",
    "wealth_timeline": "When major financial gains or losses are indicated",
    "asset_accumulation": "Types of assets and timing of major acquisitions",
    "business_aptitude": "Entrepreneurial potential and business success indicators",
    "money_management": "Natural tendencies toward saving, investing, or spending"
  },
  "mount_analysis": {
    "mount_of_venus": "Love, passion, and physical vitality indicators",
    "mount_of_jupiter": "Leadership, ambition, and authority potential",
    "mount_of_saturn": "Wisdom, responsibility, and life challenges",
    "mount_of_apollo": "Creativity, fame, and artistic talents",
    "mount_of_mercury": "Communication, business acumen, and adaptability",
    "mount_of_mars": "Courage, aggression, and conflict resolution",
    "mount_of_luna": "Intuition, imagination, and spiritual connection"
  },
  "line_intersections": {
    "life_heart_intersection": "Where life and heart lines meet - emotional stability timing",
    "head_fate_intersection": "Career and intellectual alignment periods",
    "marriage_lines": "Number and timing of significant relationships",
    "travel_lines": "Major journeys and relocations indicated",
    "health_indicators": "Lines indicating health challenges or vitality periods"
  },
  "age_timeline": {
    "life_line_ages": "Specific age markers along the life line with predictions",
    "career_milestones": "Ages when major career changes or successes occur",
    "relationship_timing": "Ages when significant relationships begin or end",
    "wealth_peaks": "Specific ages when financial success is most likely",
    "health_events": "Ages when health attention is most needed"
  },
  "partnership_predictions": {
    "partner_characteristics": "Physical and personality traits of future partners",
    "partner_wealth": "Financial status and potential of romantic partners",
    "marriage_timing": "Most favorable ages for marriage or commitment",
    "relationship_challenges": "Potential obstacles in partnerships",
    "family_predictions": "Children, family size, and domestic harmony"
  }
}

ANALYSIS REQUIREMENTS:
1. Examine the palm mounts (raised areas) for personality and fortune insights
2. Look for age markers along the life line (typically from thumb to wrist)
3. Analyze line intersections for timing of major life events
4. Assess wealth indicators through mount prominence and line strength
5. Identify marriage lines (horizontal lines on the mount of Mercury)
6. Look for travel lines and health indicators
7. Provide specific age predictions based on traditional palmistry mapping
8. Focus on positive guidance while being realistic about challenges

Provide detailed, specific predictions with age ranges and actionable insights. Base all interpretations on what you can actually observe in the palm image.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Please analyze my palm and provide a detailed palmistry reading based on what you can see in the image."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ];

    console.log('Sending request to OpenAI...', {
      hasImage: true,
      messageLength: messages[1].content[0].text.length,
      finalImageUrl: `data:${mimeType};base64,${imageBase64.substring(0, 50)}...`
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4.1-2025-04-14",
        messages: messages,
        max_tokens: 2000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    const analysis = data.choices[0].message.content;
    console.log('Analysis completed, length:', analysis.length);
    console.log('Raw analysis preview:', analysis.substring(0, 500));

    // Try to parse JSON response first, fall back to text parsing
    let enhancedData;
    try {
      // Clean the response to extract JSON
      const jsonMatch = analysis.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonString = jsonMatch[0];
        console.log('Found JSON string, length:', jsonString.length);
        enhancedData = JSON.parse(jsonString);
        console.log('Successfully parsed JSON response');
        console.log('Enhanced data keys:', Object.keys(enhancedData));
      } else {
        console.log('No JSON found in response');
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      console.log('Using text analysis fallback');
    }

    // Parse line strengths from the analysis
    const parseLineStrength = (content: string, lineType: string): string => {
      const lineSection = content.match(new RegExp(`${lineType} line[\\s\\S]*?(?=\\n\\n\\d+\\.|$)`, 'i'));
      
      if (lineSection) {
        const sectionText = lineSection[0].toLowerCase();
        if (sectionText.includes('strong') || sectionText.includes('deep') || sectionText.includes('prominent') || sectionText.includes('clear') || sectionText.includes('well-defined') || sectionText.includes('excellent') || sectionText.includes('impressive')) {
          return 'Strong';
        } else if (sectionText.includes('weak') || sectionText.includes('faint') || sectionText.includes('shallow') || sectionText.includes('light') || sectionText.includes('thin')) {
          return 'Weak';
        }
      }
      return 'Moderate';
    };

    // Extract personality traits from the analysis
    const extractTraits = (content: string) => {
      const traits = {
        personality: 'Balanced and intuitive',
        strengths: 'Strong emotional intelligence and analytical abilities',
        challenges: 'Finding harmony between logic and intuition'
      };

      // Try to extract more specific traits from the analysis
      if (content.toLowerCase().includes('creative') || content.toLowerCase().includes('artistic')) {
        traits.personality = 'Creative and imaginative';
        traits.strengths = 'Artistic vision and innovative thinking';
      } else if (content.toLowerCase().includes('analytical') || content.toLowerCase().includes('logical')) {
        traits.personality = 'Analytical and methodical';
        traits.strengths = 'Logical reasoning and problem-solving';
      } else if (content.toLowerCase().includes('emotional') || content.toLowerCase().includes('passionate')) {
        traits.personality = 'Emotional and passionate';
        traits.strengths = 'Deep emotional intelligence and empathy';
      }

      return traits;
    };

    // Return comprehensive palm reading structure that matches database schema
    const palmReading = {
      life_line_strength: parseLineStrength(analysis, 'life'),
      heart_line_strength: parseLineStrength(analysis, 'heart'),
      head_line_strength: parseLineStrength(analysis, 'head'),
      fate_line_strength: parseLineStrength(analysis, 'fate'),
      overall_insight: enhancedData?.overall_insight || analysis,
      traits: extractTraits(analysis),
      // Add enhanced palmistry data
      age_predictions: enhancedData?.age_predictions || null,
      wealth_analysis: enhancedData?.wealth_analysis || null,
      mount_analysis: enhancedData?.mount_analysis || null,
      line_intersections: enhancedData?.line_intersections || null,
      age_timeline: enhancedData?.age_timeline || null,
      partnership_predictions: enhancedData?.partnership_predictions || null
    };

    console.log('Palm reading structure created:', {
      life_line_strength: palmReading.life_line_strength,
      heart_line_strength: palmReading.heart_line_strength,
      head_line_strength: palmReading.head_line_strength,
      fate_line_strength: palmReading.fate_line_strength,
      traits: palmReading.traits,
      hasEnhancedData: {
        age_predictions: !!palmReading.age_predictions,
        wealth_analysis: !!palmReading.wealth_analysis,
        mount_analysis: !!palmReading.mount_analysis,
        line_intersections: !!palmReading.line_intersections,
        age_timeline: !!palmReading.age_timeline,
        partnership_predictions: !!palmReading.partnership_predictions
      }
    });

    return new Response(JSON.stringify(palmReading), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in palm reading function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to analyze palm image',
      details: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});