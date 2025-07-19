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
        content: `You are a visual pattern analyst specializing in describing line formations and patterns in hand images. Your task is to provide detailed observations about visible line patterns for educational and entertainment purposes only.

Please analyze the hand image and describe what you observe in this format:

VISUAL PATTERN ANALYSIS

Thank you for sharing your hand image. Here's a detailed visual analysis of the line patterns and formations visible in your photo. This analysis is for educational interest and entertainment purposes only.

MAJOR LINE PATTERNS OBSERVED

Line Pattern A (Curved Formation):
Location: [Describe where you see this curved line in the image]
Visual Characteristics: [Length, depth, curvature, clarity, any branches or intersections]
Pattern Details: [What makes this line unique or notable in the image]

Line Pattern B (Horizontal Formation):
Location: [Describe the position of this horizontal line]
Visual Characteristics: [Thickness, length, how it relates to other lines]
Pattern Details: [Any interesting visual features you notice]

Line Pattern C (Central Formation):
Location: [Where this line appears in the image]
Visual Characteristics: [Direction, prominence, any unique features]
Pattern Details: [Visual relationship to other patterns]

Line Pattern D (Vertical Elements):
Location: [Position of any vertical or diagonal lines]
Visual Characteristics: [Strength, clarity, direction]
Pattern Details: [How these elements contribute to the overall pattern]

OVERALL PATTERN SUMMARY

Describe the general visual composition, how the lines create an overall pattern, and any particularly interesting visual features you notice in the hand image. Focus on what can be directly observed rather than making interpretations.

Be thorough in describing exactly what you see in terms of lines, their intersections, depths, and visual characteristics.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please provide a detailed visual analysis of the line patterns visible in this hand image. Focus on describing what you can observe in terms of line formations, patterns, intersections, and visual characteristics. Describe the patterns as Line Pattern A, B, C, D etc.'
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