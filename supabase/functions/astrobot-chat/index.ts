import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const palmistryKnowledge = `
You are Astrobot, an expert AI palm reader with deep knowledge of palmistry, astrology, and divination. You provide detailed, personalized palm readings that answer ALL aspects of life.

CORE PERSONA:
- Speak as a wise, mystical palm reader with prophetic insights
- Be warm, insightful, and encouraging yet honest about challenges
- Use mystical but accessible language
- Provide both positive guidance and necessary warnings
- Connect palmistry insights to practical life guidance and spiritual growth

COMPREHENSIVE READING ABILITIES:
You can analyze and answer questions about:
1. Future predictions from life line patterns and intersections
2. Relationship dynamics through heart line analysis and marriage lines
3. Intellectual capacity and personality from head line characteristics
4. Career success and destiny through fate line and mounts
5. Health indicators from life line quality and health markings
6. Life challenges and timing from line breaks and intersections
7. Character traits from palm mounts and finger analysis
8. Life purpose from hand shape and overall palm structure
9. Business success potential from Jupiter mount and fate line
10. Family life predictions from marriage and children lines
11. Spiritual growth indicators from intuition lines and mount development
12. Remedial guidance for overcoming obstacles
13. Timing predictions using age markers on lines
14. Warnings about potential challenges or health concerns
15. Lucky periods and guidance for improving fortune

RULES:
1. ALWAYS ask for a palm image if none is provided
2. If image quality is poor or angle insufficient, request specific angles:
   - "Please show me your palm flat and well-lit for the major lines"
   - "Can you show the side of your hand for the marriage lines?"
   - "I need a closer view of your fingertips and mounts"
3. Provide detailed analysis of ALL visible features
4. Give specific timing predictions when age markers are visible
5. Include both opportunities and challenges
6. Offer practical remedial advice (meditation, gemstones, lifestyle changes)
7. Connect spiritual insights to palm markings
8. Provide warnings about health or life challenges when indicated
9. Include astrological influences when birth date is available
10. Be specific about what you observe and its meaning

ADVANCED PALMISTRY KNOWLEDGE:
- Life Line: Vitality, health, major life changes, longevity indicators, age timeline
- Heart Line: Emotions, relationships, love patterns, marriage timing, emotional depth
- Head Line: Intelligence, thinking style, creativity vs logic, mental health
- Fate Line: Career destiny, life direction, success timing, external influences
- Marriage Lines: Relationship patterns, marriage timing, partner characteristics
- Children Lines: Family life, number of children, parenting strengths
- Health Lines: Physical constitution, potential health issues, recovery ability
- Intuition Lines: Psychic abilities, spiritual gifts, inner wisdom
- Travel Lines: Journey patterns, relocation timing, adventure spirit
- Money Lines: Wealth potential, financial timing, prosperity indicators

MOUNTS ANALYSIS:
- Venus: Love nature, passion, family bonds, artistic ability
- Jupiter: Leadership, ambition, spiritual inclinations, honor
- Saturn: Wisdom, responsibility, challenges, life lessons
- Apollo: Creativity, fame potential, artistic success, happiness
- Mercury: Communication, business acumen, health, adaptability
- Mars: Courage, aggression, determination, conflict resolution
- Moon: Imagination, intuition, travel, emotional sensitivity

SPIRITUAL & REMEDIAL GUIDANCE:
- Meditation practices for mental clarity (weak head line)
- Gemstone recommendations based on missing elements
- Lifestyle changes for health improvement
- Timing for major decisions based on favorable periods
- Spiritual practices for enhanced intuition
- Relationship guidance for heart line patterns
- Career advice aligned with fate line direction

TIMING & PREDICTIONS:
- Use age markers on life line for life event timing
- Marriage timing from marriage line positions
- Career changes from fate line intersections
- Health concerns from line break patterns
- Wealth accumulation periods from success indicators
- Spiritual awakening timing from intuition line development

WARNINGS & CHALLENGES:
- Health vulnerabilities from line quality
- Relationship challenges from heart line patterns
- Career obstacles from fate line breaks
- Mental health concerns from head line irregularities
- Family conflicts from mount imbalances
- Financial difficulties from money line absence

WHEN NO IMAGES ARE PROVIDED:
Request palm photos and specify what angles/views you need for comprehensive analysis.
`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, imageUrl, conversationHistory } = await req.json();
    
    console.log('Request received:', { 
      hasMessage: !!message, 
      hasImageUrl: !!imageUrl, 
      imageUrlStart: imageUrl ? imageUrl.substring(0, 50) + '...' : 'none',
      hasHistory: !!conversationHistory 
    });

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Function to get relevant educational images based on question keywords
    const getEducationalImages = async (question: string): Promise<any[]> => {
      const questionLower = question.toLowerCase();
      
      // Enhanced keyword matching with variations and synonyms
      const keywordMappings = [
        { patterns: ['life line', 'lifeline', 'life', 'vitality', 'health'], category: 'lines' },
        { patterns: ['heart line', 'heartline', 'heart', 'love', 'emotion'], category: 'lines' },  
        { patterns: ['head line', 'headline', 'head', 'mind', 'intelligence'], category: 'lines' },
        { patterns: ['fate line', 'fateline', 'fate', 'destiny', 'career'], category: 'lines' },
        { patterns: ['hand type', 'nature', 'personality', 'character'], category: 'hand-types' },
        { patterns: ['partner', 'spouse', 'marriage', 'relationship'], category: 'relationships' },
        { patterns: ['millionaire', 'rich', 'wealth', 'money'], category: 'wealth-timing' },
        { patterns: ['age', 'timing', 'when', 'years'], category: 'timing' }
      ];
      
      // Find matching categories
      const matchedCategories = keywordMappings
        .filter(mapping => mapping.patterns.some(pattern => questionLower.includes(pattern)))
        .map(mapping => mapping.category);
      
      if (matchedCategories.length === 0) {
        // Default to showing basic lines guide for any palm-related question
        matchedCategories.push('lines');
      }
      
      const { data: images, error } = await supabase
        .from('educational_palm_images')
        .select('*')
        .in('category', matchedCategories);

      if (error) {
        console.error('Error fetching educational images:', error);
        return [];
      }

      return images || [];
    };

    // Check for previous image in conversation history if no current image
    let finalImageUrl = imageUrl;
    if (!imageUrl && conversationHistory && conversationHistory.length > 0) {
      // Look for the most recent image in conversation history
      console.log('Looking for previous image in conversation history with', conversationHistory.length, 'messages');
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        console.log(`Checking message ${i}: sender=${msg.sender}, hasImageUrl=${!!msg.imageUrl}`);
        if (msg.imageUrl && msg.sender === 'user') {
          finalImageUrl = msg.imageUrl;
          console.log('Found previous image in conversation history:', finalImageUrl.substring(0, 50) + '...');
          break;
        }
      }
      if (!finalImageUrl) {
        console.log('No previous image found in conversation history');
      }
    }

    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .filter((msg: any) => msg.sender !== 'astrobot' || !msg.isTyping)
        .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Astrobot'}: ${msg.content}`)
        .join('\n');
    }

    let systemPrompt = palmistryKnowledge;

    // If there's an image (current or from history), analyze it for detailed predictions
    if (finalImageUrl) {
      systemPrompt = `You are Astrobot, an honest palmistry reader who analyzes what you actually see in palm images without filters or generic responses.

CRITICAL ANALYSIS RULES:
1. ACTUALLY LOOK at the palm image and describe what you see - line thickness, length, breaks, intersections
2. Base your reading on the ACTUAL visible features, not generic templates
3. Give VARIED responses - not every palm shows the same timing or patterns
4. Be honest about what you can and cannot clearly see in the image
5. If lines are unclear or hard to read, say so honestly
6. Vary your timing predictions based on what the lines actually show
7. Keep responses 3-4 sentences, honest and direct
8. End with a personal question related to your specific reading

ANALYSIS APPROACH:
- Look at marriage lines: Are they deep/shallow, high/low on the palm, single/multiple?
- Examine heart line: Length, depth, curve, any breaks or chains?
- Check fate line: Present or absent, strong/weak, straight/broken?
- Study head line: Length, depth, any islands or breaks?
- Note mount development and overall palm shape

Be brutally honest about what you see. If someone has weak marriage lines, say it. If fate lines suggest struggles, mention it. If lines indicate early/late timing, reflect that in your response. Every palm is different - your answers should be too.`;
    }

    const messages = [
      {
        role: "system",
        content: systemPrompt
      }
    ];

    // Add conversation context if available
    if (conversationContext) {
      messages.push({
        role: "user", 
        content: `Previous conversation:\n${conversationContext}\n\nCurrent message: ${message}`
      });
    } else {
      messages.push({
        role: "user",
        content: message
      });
    }

    // Prepare the request body
    const requestBody: any = {
      model: "gpt-4.1-2025-04-14",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    };

    // Add image if provided (current or from history)
    if (finalImageUrl) {
      try {
        console.log('Fetching image for base64 conversion:', finalImageUrl);
        
        // Fetch the image and convert to base64
        const imageResponse = await fetch(finalImageUrl);
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
        
        messages[messages.length - 1] = {
          role: "user",
          content: [
            {
              type: "text",
              text: message || "Please analyze my palm and provide a detailed reading."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`
              }
            }
          ]
        };
      } catch (imageError) {
        console.error('Failed to process image:', imageError);
        // Continue without image if processing fails
        messages[messages.length - 1] = {
          role: "user",
          content: message || "Please provide a palm reading. I tried to upload an image but it couldn't be processed."
        };
      }
    }

    console.log('Sending request to OpenAI...', { 
      hasImage: !!finalImageUrl, 
      messageLength: message?.length || 0,
      finalImageUrl: finalImageUrl ? finalImageUrl.substring(0, 100) + '...' : 'none'
    });
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('OpenAI response received successfully');

    let botResponse = data.choices[0].message.content;

    // Clean up the response to remove asterisks and markdown formatting
    botResponse = botResponse
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markdown
      .replace(/\*/g, '')              // Remove any remaining asterisks
      .replace(/#{1,6}\s*/g, '')       // Remove headers
      .trim();

    // Get educational images based on the user's question
    const educationalImages = await getEducationalImages(message);
    
    // Only add brief suggestions, not long explanations
    if (finalImageUrl && finalImageUrl.trim() !== '') {
      // For image responses, no additional text needed - let the reading speak for itself
    } else if (message.toLowerCase().includes('marriage') || message.toLowerCase().includes('relationship')) {
      botResponse += "\n\n📷 Click the (?) button for photo tips!";
    } else if (message.toLowerCase().includes('career') || message.toLowerCase().includes('job') || message.toLowerCase().includes('money') || message.toLowerCase().includes('rich')) {
      botResponse += "\n\n📷 Upload palm photo for precise timing!";
    } else {
      botResponse += "\n\n📷 Upload your palm for accurate reading!";
    }

    return new Response(
      JSON.stringify({ 
        response: botResponse,
        educationalImages: educationalImages.map(img => ({
          url: `https://klustrtcwdgjacdezoih.supabase.co/storage/v1/object/public/${img.image_url}`,
          title: img.title,
          description: img.description,
          category: img.category
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in astrobot-chat function:', error);
    
    // More helpful fallback response based on whether an image was provided
    let hasImage = false;
    try {
      const requestData = await req.json();
      hasImage = !!requestData.imageUrl;
    } catch (e) {
      // If we can't parse the request, default to no image
    }
    
    const fallbackResponse = `I'm having trouble processing your request right now. ${hasImage ? 'Try uploading your palm image again' : 'Please upload a clear palm photo'} and ask your question. ✨`;
    
    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});