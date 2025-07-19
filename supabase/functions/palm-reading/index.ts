import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  console.log('=== DETAILED PALM READING FUNCTION CALLED ===');
  console.log('Method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openaiApiKey) {
      console.error('OpenAI API key not found');
      throw new Error('OpenAI API key not configured');
    }

    console.log('OpenAI API Key available: true');
    
    const { imageUrl } = await req.json();
    console.log('Request received with image URL:', { imageUrl });

    if (!imageUrl) {
      throw new Error('Palm image URL is required');
    }

    // Download and convert images to base64
    console.log('Starting image downloads...');
    
    const downloadImage = async (url: string): Promise<string> => {
      console.log('Downloading:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.error('Download failed:', response.status, response.statusText);
        throw new Error(`Failed to download: ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      
      // Convert to base64 in chunks to avoid stack overflow
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunkSize = 8192;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64 = btoa(binary);
      console.log('Download successful, base64 length:', base64.length);
      return base64;
    };

    const palmBase64 = await downloadImage(imageUrl);
    
    console.log('All images downloaded successfully');

    // Create detailed ChatGPT-style palm reading request
    const messages = [
      {
        role: 'system',
        content: `You are a master palmist with decades of experience. Analyze the palm image in great detail and provide a comprehensive palmistry-style reading exactly like a professional palmist would.

Start with: "Thank you for sharing your palm image. Here's a detailed palmistry-style reading based on the visible features from your photo. This is an interpretive analysis and should be seen as symbolic guidance, not a scientific assessment."

Then provide this exact structure (NO markdown symbols, NO asterisks, NO hashtags):

PALM READING ANALYSIS

1. LIFE LINE

Observation: [Describe exactly what you observe about the life line - its length, depth, curve, clarity, where it starts and ends, any breaks or markings you can see in the image]

Interpretation:
- Vitality: [Detailed analysis of their physical energy and stamina based on what you observe]
- Life Journey: [What the line's characteristics suggest about their life path, stability, major life changes]  
- Health Influence: [What the line's depth and quality indicate about their health and capacity to recover]

2. HEART LINE

Observation: [Describe exactly what you observe about the heart line - its length, depth, curve, position, where it starts and ends, its relationship to other lines]

Interpretation:
- Emotional Depth: [Analysis of their emotional intelligence and capacity for deep connections]
- Relationships: [What the line reveals about their approach to love, commitment, and relationships]
- Capacity for Love: [Their ability to give and receive love, emotional expression, romantic tendencies]

3. HEAD LINE

Observation: [Describe exactly what you observe about the head line - its direction, length, depth, clarity, any forks, branches, or unique characteristics]

Interpretation:
- Mental Clarity: [Analysis of their thinking patterns, mental approach, and cognitive style]
- Decision Making: [How they process information, analyze situations, and make choices]
- Intellectual Style: [Whether they're more practical, creative, analytical, intuitive, etc.]

4. FATE LINE

Observation: [Describe what you observe about the fate line - its presence/absence, strength, direction, where it begins and ends, how prominent it is]

Interpretation:
- Career Path: [What the line suggests about their professional journey and work life]
- Life Direction: [Their sense of purpose, destiny, and life goals]
- External Influences: [How outside forces, family, society affect their life path]

Be extremely detailed in your observations of what you actually see in the palm images. Look closely at line depth, length, curves, intersections, and unique features. Provide comprehensive, insightful interpretations that feel personal and meaningful. Format everything with clear line breaks and proper spacing for readability.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze my palm image and provide a detailed palmistry reading in the format specified. Look closely at all the major lines and their characteristics.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${palmBase64}`
            }
          }
        ]
      }
    ];


    console.log('Calling OpenAI API for detailed ChatGPT-style palm analysis...');
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 4000,
        temperature: 0.7
      }),
    });

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI error:', errorText);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    let analysis = data.choices?.[0]?.message?.content || '';
    
    if (!analysis) {
      throw new Error('No analysis content received');
    }

    console.log('Raw AI response length:', analysis.length);
    console.log('Raw AI response preview:', analysis.substring(0, 200));
    
    // Clean up any remaining markdown symbols and formatting
    analysis = analysis
      .replace(/#{1,6}\s*/g, '') // Remove hashtags
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
      .replace(/•/g, '-') // Replace bullet points with dashes
      .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double
      .trim();
    
    console.log('Cleaned AI response preview:', analysis.substring(0, 200));
    console.log('Detailed ChatGPT-style analysis completed successfully');

    // Parse the detailed analysis to extract structured data
    const parseLineStrength = (content: string, lineType: string): string => {
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes(`${lineType} line`) && (lowerContent.includes('strong') || lowerContent.includes('deep') || lowerContent.includes('prominent') || lowerContent.includes('clear'))) {
        return 'Strong';
      } else if (lowerContent.includes(`${lineType} line`) && (lowerContent.includes('weak') || lowerContent.includes('faint') || lowerContent.includes('shallow'))) {
        return 'Weak';
      }
      return 'Moderate';
    };

    // Return comprehensive palm reading structure
    const palmReading = {
      life_line_strength: parseLineStrength(analysis, 'life'),
      heart_line_strength: parseLineStrength(analysis, 'heart'),
      head_line_strength: parseLineStrength(analysis, 'head'),
      fate_line_strength: parseLineStrength(analysis, 'fate'),
      overall_insight: analysis, // Full detailed ChatGPT-style analysis
      traits: {
        personality: 'Detailed analysis provided in full reading',
        strengths: 'See comprehensive analysis above',
        challenges: 'Covered in detailed interpretation'
      }
    };

    console.log('Detailed palm reading processed successfully');

    return new Response(JSON.stringify(palmReading), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detailed palm reading function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Palm reading failed', 
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});