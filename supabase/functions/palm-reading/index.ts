import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

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
    
    const { leftImageUrl, rightImageUrl } = await req.json();
    console.log('Request received with image URLs:', { leftImageUrl, rightImageUrl });

    if (!leftImageUrl) {
      throw new Error('Left palm image URL is required');
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

    const leftBase64 = await downloadImage(leftImageUrl);
    const rightBase64 = rightImageUrl ? await downloadImage(rightImageUrl) : null;
    
    console.log('All images downloaded successfully');

    // Create OpenAI request with detailed palm reading format
    const messages = [
      {
        role: 'system',
        content: `You are a master palmist with decades of experience in traditional palmistry and astrological sciences. Analyze the palm image(s) and provide a detailed palm reading in this EXACT format:

### Life Line
**Location**: [Describe where the line is located on the palm]
**Meaning**: [Explain what this line represents about vitality and life energy]
**Your Reading**: [Provide specific analysis of their life line - length, depth, clarity, and what it reveals about their health, vitality, and life path]

### Heart Line
**Location**: [Describe where the line is located on the palm]
**Meaning**: [Explain what this line represents about emotions and relationships]
**Your Reading**: [Provide specific analysis of their heart line and what it reveals about their emotional nature, relationships, and capacity for love]

### Head Line
**Location**: [Describe where the line is located on the palm]
**Meaning**: [Explain what this line represents about intellect and thinking patterns]
**Your Reading**: [Provide specific analysis of their head line and what it reveals about their mental abilities, decision-making, and thought processes]

### Fate Line
**Location**: [Describe where the line is located on the palm]
**Meaning**: [Explain what this line represents about destiny and career path]
**Your Reading**: [Provide specific analysis of their fate line and what it reveals about their life direction, career success, and external influences]

### Overall Insight
[Provide a comprehensive 2-3 paragraph overview combining all the palm lines to give insights about their personality, character traits, strengths, potential challenges, and guidance for their future path. Be mystical, insightful, and encouraging.]

Be detailed, mystical, and provide specific insights based on what you observe in the palm lines.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: rightBase64 ? 
              'Analyze both palm images (left and right hands) and provide a comprehensive palm reading in the detailed format specified. Compare insights from both hands to give a complete reading.' :
              'Analyze this palm image and provide a detailed palm reading in the format specified above.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${leftBase64}`
            }
          }
        ]
      }
    ];

    // Add right hand image if available
    if (rightBase64) {
      messages[1].content.push({
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${rightBase64}`
        }
      });
    }

    console.log('Calling OpenAI API for detailed palm analysis...');
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 2000,
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
    const analysis = data.choices?.[0]?.message?.content || '';
    
    if (!analysis) {
      throw new Error('No analysis content received');
    }

    console.log('Detailed analysis completed successfully');

    // Parse the detailed analysis to extract structured data
    const parseLineStrength = (content: string, lineType: string): string => {
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes(`${lineType} line`) && (lowerContent.includes('strong') || lowerContent.includes('deep') || lowerContent.includes('prominent'))) {
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
      overall_insight: analysis, // Full detailed analysis
      traits: {
        personality: 'Complex and multifaceted individual',
        strengths: 'Strong intuition and analytical abilities',
        challenges: 'Balancing emotions with logic'
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