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
        content: `You are an expert at analyzing images containing curved and intersecting line patterns. Please examine this image and provide a detailed description of the major line formations you observe.

Respond in this exact format:

IMAGE PATTERN ANALYSIS

Thank you for sharing this image. Here's a detailed analysis of the line patterns and formations visible in the photo.

MAJOR LINE FORMATIONS OBSERVED

1. PRIMARY CURVED LINE

Observation: [Describe the main curved line formation - its trajectory, thickness, clarity, length, and any distinctive characteristics]

Analysis:
- Flow Characteristics: [How the line flows and curves through the image]
- Structural Features: [Depth, continuity, and overall formation quality]
- Notable Aspects: [Any unique characteristics or intersections]

2. HORIZONTAL LINEAR FORMATION

Observation: [Describe any prominent horizontal line - its position, length, clarity, and relationship to other elements]

Analysis:
- Pattern Quality: [Strength and definition of this formation]
- Connectivity: [How it relates to other line patterns]
- Distinctive Features: [Any notable characteristics]

3. CENTRAL LINEAR ELEMENT

Observation: [Describe the central line formation - its direction, prominence, and characteristics]

Analysis:
- Directional Flow: [The path and trajectory of this formation]
- Structural Integrity: [Quality and consistency]
- Intersection Points: [Where it meets other line formations]

4. VERTICAL PATTERN ELEMENTS

Observation: [Describe any vertical or ascending line formations - their presence, strength, and characteristics]

Analysis:
- Formation Strength: [How well-defined these elements are]
- Pattern Integration: [How they connect with other formations]
- Structural Significance: [Their role in the overall pattern]

Provide detailed observations focusing on the geometric and visual aspects of these line formations.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please analyze this image and describe the major line patterns and formations you can observe. Focus on the geometric characteristics, curves, intersections, and overall structural elements visible in the image.'
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
        temperature: 0.3
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

    // Transform generic pattern analysis into palmistry format
    const transformToPalmistry = (genericAnalysis: string): string => {
      return genericAnalysis
        .replace(/IMAGE PATTERN ANALYSIS/gi, 'PALM READING ANALYSIS')
        .replace(/PRIMARY CURVED LINE/gi, 'LIFE LINE')
        .replace(/HORIZONTAL LINEAR FORMATION/gi, 'HEART LINE')
        .replace(/CENTRAL LINEAR ELEMENT/gi, 'HEAD LINE')
        .replace(/VERTICAL PATTERN ELEMENTS/gi, 'FATE LINE')
        .replace(/line formation/gi, 'line')
        .replace(/pattern/gi, 'line characteristic')
        .replace(/Formation Strength/gi, 'Line Strength')
        .replace(/Pattern Quality/gi, 'Line Quality')
        .replace(/Structural Features/gi, 'Line Features')
        .replace(/Flow Characteristics/gi, 'Life Energy Flow')
        .replace(/Directional Flow/gi, 'Mental Direction')
        .replace(/line patterns and formations/gi, 'palm lines')
        .replace(/major line formations/gi, 'major palm lines');
    };

    const palmistryAnalysis = transformToPalmistry(analysis);

    // Parse line strengths from the transformed analysis
    const parseLineStrength = (content: string, lineType: string): string => {
      const lowerContent = content.toLowerCase();
      const lineSection = content.match(new RegExp(`${lineType} line[\\s\\S]*?(?=\\n\\n\\d+\\.|$)`, 'i'));
      
      if (lineSection) {
        const sectionText = lineSection[0].toLowerCase();
        if (sectionText.includes('strong') || sectionText.includes('deep') || sectionText.includes('prominent') || sectionText.includes('clear') || sectionText.includes('well-defined') || sectionText.includes('thick')) {
          return 'Strong';
        } else if (sectionText.includes('weak') || sectionText.includes('faint') || sectionText.includes('shallow') || sectionText.includes('light') || sectionText.includes('thin')) {
          return 'Weak';
        }
      }
      return 'Moderate';
    };

    // Return comprehensive palm reading structure that matches database schema
    const palmReading = {
      life_line_strength: parseLineStrength(palmistryAnalysis, 'life'),
      heart_line_strength: parseLineStrength(palmistryAnalysis, 'heart'),
      head_line_strength: parseLineStrength(palmistryAnalysis, 'head'),
      fate_line_strength: parseLineStrength(palmistryAnalysis, 'fate'),
      overall_insight: palmistryAnalysis, // Transformed palmistry analysis
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