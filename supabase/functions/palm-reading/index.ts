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

    // Use the same model and approach as astrobot
    const messages = [
      {
        role: "system",
        content: `You are an expert palmistry reader who analyzes hand images to provide detailed palm readings. 

PALM READING STRUCTURE:
Analyze the palm image and provide a comprehensive reading in exactly this format:

PALM READING ANALYSIS

Thank you for sharing your palm image. Here's a detailed analysis based on traditional palmistry principles.

MAJOR PALM LINES ANALYSIS

1. LIFE LINE

Observation: [Describe what you observe about the life line - its depth, length, curve, clarity, any breaks or markings]

Interpretation:
- Vitality: [Analysis of physical energy, health, stamina based on the life line]
- Life Journey: [Insights about life path, stability, adaptability based on the curve and flow]
- Health Influence: [Traditional palmistry interpretations about constitution and resilience]

2. HEART LINE

Observation: [Describe the heart line - its path, depth, endings, branches, clarity]

Interpretation:
- Emotional Depth: [Analysis of emotional nature and capacity for feelings]
- Relationships: [Insights about love life, relationship patterns, emotional approach]
- Capacity for Love: [Traditional interpretations about giving and receiving love]

3. HEAD LINE

Observation: [Describe the head line - its direction, length, depth, slope, any markings]

Interpretation:
- Mental Clarity: [Analysis of thinking patterns, intellectual capabilities]
- Decision Making: [Insights about how decisions are made, logical vs intuitive]
- Intellectual Style: [Traditional interpretations about mental approach and creativity]

4. FATE LINE

Observation: [Describe the fate line if present - its strength, direction, starting point, clarity]

Interpretation:
- Career Path: [Analysis of professional tendencies and ambitions]
- Life Direction: [Insights about sense of purpose and destiny]
- External Influences: [Traditional interpretations about independence vs external guidance]

Focus on what you can actually observe in the palm lines and provide meaningful traditional palmistry interpretations. Be specific about what you see and give positive, insightful guidance.`
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
      overall_insight: analysis,
      traits: extractTraits(analysis)
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