import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

async function analyzeImageWithOpenAI(imageUrl: string): Promise<string> {
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  console.log('Calling OpenAI API for palm analysis...');
  
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
          content: `You are an expert in traditional line analysis and physiognomy, a centuries-old practice of interpreting hand features. Analyze the hand image provided and give a detailed traditional interpretation based on the major lines visible. Structure your response exactly as follows:

PALM READING ANALYSIS

Thank you for sharing your palm image. Here's a detailed analysis based on traditional palmistry principles.

MAJOR PALM LINES ANALYSIS

1. LIFE LINE

Observation: [Describe what you observe about the curved line that runs around the thumb - its depth, length, curve, clarity, any breaks or markings]

Interpretation:
- Vitality: [Traditional interpretation of physical energy and constitution based on this line's characteristics]
- Life Journey: [Insights about life approach and resilience based on the curve and flow]
- Health Influence: [Traditional beliefs about wellness and stamina reflected in this line]

2. HEART LINE

Observation: [Describe the horizontal line across the upper palm - its path, depth, endings, branches, clarity]

Interpretation:
- Emotional Depth: [Traditional interpretation of emotional nature based on this line]
- Relationships: [Insights about interpersonal connections and emotional approach]
- Capacity for Love: [Traditional beliefs about emotional giving and receiving]

3. HEAD LINE

Observation: [Describe the central horizontal line - its direction, length, depth, slope, any markings]

Interpretation:
- Mental Clarity: [Traditional interpretation of thinking patterns and mental approach]
- Decision Making: [Insights about cognitive style based on this line's characteristics]
- Intellectual Style: [Traditional beliefs about mental processing and creativity]

4. FATE LINE

Observation: [Describe the vertical line if present - its strength, direction, starting point, clarity]

Interpretation:
- Career Path: [Traditional interpretation of professional tendencies]
- Life Direction: [Insights about sense of purpose and goals]
- External Influences: [Traditional beliefs about independence vs guidance]

Focus on describing the actual visible lines and their traditional interpretations according to historical palmistry texts. Provide positive, constructive insights based on what you observe.`
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze the lines and features visible in this hand image according to traditional line analysis practices. Focus on the major lines: the curved line around the thumb area, the horizontal lines across the palm, and any vertical lines.'
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
      max_tokens: 2000,
      temperature: 0.7
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('OpenAI API error:', error);
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  console.log('OpenAI response received successfully');
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenAI');
  }

  return data.choices[0].message.content;
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

    // Use OpenAI for AI-powered palm analysis
    console.log('Performing AI-powered palm analysis...');
    const analysis = await analyzeImageWithOpenAI(imageUrl);
    console.log('AI analysis completed successfully');

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