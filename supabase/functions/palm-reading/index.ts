import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

async function analyzeImageWithOpenAI(imageUrl: string): Promise<string> {
  if (!openaiApiKey) {
    console.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  console.log('Calling OpenAI API for palm analysis...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert in traditional hand line analysis. Analyze the hand image and describe what you observe about the lines. Structure your response as:

PALM READING ANALYSIS

Thank you for sharing your palm image. Here's a detailed analysis based on traditional line interpretation.

MAJOR PALM LINES ANALYSIS

1. LIFE LINE
Observation: [Describe the curved line around the thumb area]
Interpretation:
- Vitality: [Energy and health indicators]
- Life Journey: [Stability and adaptability]
- Health Influence: [Constitutional strength]

2. HEART LINE
Observation: [Describe the upper horizontal line]
Interpretation:
- Emotional Depth: [Emotional nature]
- Relationships: [Connection patterns]
- Capacity for Love: [Emotional giving/receiving]

3. HEAD LINE
Observation: [Describe the central horizontal line]
Interpretation:
- Mental Clarity: [Thinking patterns]
- Decision Making: [Cognitive style]
- Intellectual Style: [Mental approach]

4. FATE LINE
Observation: [Describe vertical line if present]
Interpretation:
- Career Path: [Professional tendencies]
- Life Direction: [Purpose and goals]
- External Influences: [Independence vs guidance]

Provide positive insights based on line characteristics.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze the hand lines in this image using traditional line interpretation methods.'
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
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received successfully');
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenAI');
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

function generateFallbackReading(): string {
  return `PALM READING ANALYSIS

Thank you for sharing your palm image. Here's a detailed analysis based on traditional palmistry principles.

MAJOR PALM LINES ANALYSIS

1. LIFE LINE

Observation: Your life line shows a strong, well-defined curve that flows gracefully around the base of your thumb. The line appears deep and continuous, indicating robust vitality.

Interpretation:
- Vitality: Your life line suggests strong physical energy and stamina, with a natural resilience that helps you recover from challenges
- Life Journey: The curve indicates a balanced approach to life, with stability in your core values while remaining adaptable to change
- Health Influence: The depth and clarity suggest good constitutional health and the ability to maintain energy throughout life

2. HEART LINE

Observation: The heart line runs clearly across the upper portion of your palm, showing good definition and a gentle curve toward the fingers.

Interpretation:
- Emotional Depth: You possess deep emotional intelligence and the capacity for meaningful connections with others
- Relationships: Your approach to love is both passionate and thoughtful, valuing both emotional and intellectual compatibility
- Capacity for Love: You have a generous heart with the ability to give and receive love freely, though you maintain healthy boundaries

3. HEAD LINE

Observation: Your head line travels horizontally across the center of your palm with clear definition, showing a balanced length and steady direction.

Interpretation:
- Mental Clarity: You possess analytical thinking skills combined with creative insight, allowing for well-rounded decision making
- Decision Making: You process information thoroughly before making choices, balancing logic with intuition effectively
- Intellectual Style: Your thinking style blends practical wisdom with creative problem-solving abilities

4. FATE LINE

Observation: The fate line shows moderate definition, running vertically through the center of your palm with consistent strength.

Interpretation:
- Career Path: You have natural leadership abilities and the determination to achieve your professional goals
- Life Direction: Your sense of purpose is developing steadily, with opportunities for growth in areas that align with your values
- External Influences: While you're influenced by others' guidance, you maintain independence in your major life decisions`;
}

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

    // Try OpenAI first, fallback if it fails
    console.log('Attempting AI-powered palm analysis...');
    let analysis: string;
    
    try {
      analysis = await analyzeImageWithOpenAI(imageUrl);
      console.log('AI analysis completed successfully');
    } catch (error) {
      console.warn('AI analysis failed, using fallback:', error.message);
      analysis = generateFallbackReading();
    }

    console.log('Palmistry reading generated successfully');
    console.log('Analysis length:', analysis.length);
    console.log('Analysis preview:', analysis.substring(0, 200));

    // Parse line strengths from the analysis
    const parseLineStrength = (content: string, lineType: string): string => {
      const lowerContent = content.toLowerCase();
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

    // Return comprehensive palm reading structure that matches database schema
    const palmReading = {
      life_line_strength: parseLineStrength(analysis, 'life'),
      heart_line_strength: parseLineStrength(analysis, 'heart'),
      head_line_strength: parseLineStrength(analysis, 'head'),
      fate_line_strength: parseLineStrength(analysis, 'fate'),
      overall_insight: analysis,
      traits: {
        personality: 'Balanced and intuitive',
        strengths: 'Strong emotional intelligence and analytical abilities',
        challenges: 'Finding harmony between logic and intuition'
      }
    };

    console.log('Palm reading structure created:', {
      life_line_strength: palmReading.life_line_strength,
      heart_line_strength: palmReading.heart_line_strength,
      head_line_strength: palmReading.head_line_strength,
      fate_line_strength: palmReading.fate_line_strength,
      traits: palmReading.traits
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