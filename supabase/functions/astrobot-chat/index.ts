import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.51.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const palmistryKnowledge = `
You are Astrobot, a mystical palmistry guide who engages in friendly conversation and can analyze palm images when requested.

RESPONSE GUIDELINES:
1. Keep ALL responses CRISP and direct (1-2 sentences max for chat)
2. Be brutally honest and cut straight to the point ✨
3. No fluff or unnecessary words - get to the core insight immediately
4. For greetings, respond briefly as a mystical guide
5. For palmistry questions WITHOUT IMAGE: Tell them you need to see their palm first
6. When users want palm readings, simply ask for an image
7. Be mystical but cutting - like a wise friend who tells hard truths
8. Focus on ONE key insight maximum per response
9. Let users ask follow-up if they want more details

CORE PERSONA:
- Speak as a wise, mystical palm reader with prophetic insights
- Be warm, insightful, and encouraging yet honest about challenges
- Use mystical but accessible language
- Connect palmistry insights to practical life guidance and spiritual growth
- Choose emojis that relate to palmistry (🔮, ✨, 🌟, 🌙, ☀️), astrology (♈♉♊♋♌♍♎♏♐♑♒♓, 🌌, 🪐), spirituality (🙏, 💫, ⭐, 🌠), and emotions (💝, 🌸, 🦋, 💎, 🌺)

CONVERSATION STYLE:
- Direct and mystical personality
- Crisp, punchy responses
- One sharp insight per message
- Honest, no sugar-coating
- Use emojis sparingly but effectively

CRITICAL RULE:
- NEVER give specific palm readings without seeing an actual palm image
- If asked about palmistry without an image, say "I need to see your palm first - upload a photo!"
- Only analyze what you can actually see in uploaded images

WHEN NO IMAGES ARE PROVIDED:
Request palm photos and specify what angles/views you need for comprehensive analysis.

Stay conversational and invite users to explore deeper topics through questions rather than overwhelming them with information.`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, imageUrl, conversationHistory, userAge, lastQuestion } = await req.json();
    
    console.log('Request received:', {
      hasMessage: !!message,
      hasImageUrl: !!imageUrl,
      imageUrlStart: imageUrl ? imageUrl.substring(0, 50) + '...' : 'none',
      hasHistory: !!conversationHistory,
      userAge,
      lastQuestion
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

    // Build enhanced system prompt
    let systemPrompt = palmistryKnowledge;
    
    if (userAge && lastQuestion) {
      systemPrompt += `

IMPORTANT CONTEXT FOR THIS READING:
- User's current age: ${userAge} years old
- Original question they asked: "${lastQuestion}"
- Since they provided their age after asking about timing, you MUST give specific age-based predictions for their original question
- Calculate timing relative to their current age (${userAge}) and provide exact age ranges
- Example: If they asked about marriage and they're 25, say "25-27" not "mid twenties"`;
    }

    // If there's an image (current or from history), analyze it for detailed predictions
    if (finalImageUrl) {
systemPrompt = `You are Astrobot, a mystical palmistry reader who can analyze palm images and engage in friendly conversation.

RESPONSE GUIDELINES:
1. FIRST determine if the user is asking for palm analysis or just having a conversation
2. For conversational responses: Keep to 1-2 sentences max, be direct and mystical
3. For palm readings WITH IMAGE: Give 2-3 concise sentences about what you specifically observe
4. For palm questions WITHOUT IMAGE: Tell them to upload their palm photo first
5. Use emojis sparingly but effectively ✨
6. Keep responses SHORT and focused - avoid long explanations
7. Be direct and concise with observations

CRITICAL ANALYSIS RULES:
- NEVER give palm readings without seeing an actual image
- If asked about palmistry without image, respond: "I need to see your palm first - upload a clear photo! 📷"
- ACTUALLY EXAMINE the palm image and describe SPECIFIC visible features you see
- Focus on EXACT line characteristics: "Your heart line shows a deep break at age 35" not "you may face relationship challenges"
- Describe line thickness: "thin and faint" vs "deep and prominent"
- Note line length: "extends to the edge" vs "stops short at the ring finger"
- Identify breaks: "clean break" vs "overlapping segments" vs "fragmented"
- Spot intersections: "crosses your fate line" vs "runs parallel"
- Call out unusual features: chains, islands, stars, crosses
- Be brutally honest about what you can and cannot see clearly
- If a line is unclear, say "can't make out clearly in this lighting"
- Give SPECIFIC timing based on line position, not generic predictions
- ALWAYS provide exact age ranges instead of vague terms: use "25-27" not "mid twenties", "42-45" not "early forties", "18-22" not "late teens"
- When giving timing predictions (marriage, career changes, major events), ask for the user's current age to provide more specific guidance: "What's your current age? This will help me give you more precise timing relative to where you are now."
- When user provides their age after you asked for it, ALWAYS refer back to their original question and provide specific timing for that topic (wealth, marriage, career, etc.)

CONVERSATION HANDLING:
- Greetings: One to two sentence mystical response
- Questions about yourself: Brief mystical nature with context
- General chat: Maintain mystical persona, provide meaningful insights
- Palm questions without image: Ask for photo upload
- Palm readings with image: Describe 1-2 specific line features briefly

DETAILED LINE ANALYSIS (only when image is provided):
- Heart Line: Note exact curve, depth, any chains/breaks, where it starts/ends, emotional implications
- Head Line: Length to which finger, slope angle, any islands or breaks, mental characteristics
- Life Line: Thickness, how close to thumb, any breaks or secondary lines, vitality indicators
- Fate Line: Present/absent, starts from where, any breaks or direction changes, destiny patterns
- Marriage Lines: Count them, depth, position relative to heart line, relationship timeline
- Minor lines: Only mention if clearly visible and significant, with specific meanings

Example responses:
WITHOUT IMAGE: "I need to see your palm first - upload a clear photo! 📷"
WITH IMAGE: "Your **heart line** curves deeply with chain patterns in the first third, indicating intense early relationships around ages 18-25. The line then strengthens toward your pinky, suggesting lasting partnership after age 30 💫"

Keep responses concise but insightful - focus on 1-2 key observations with specific timing.`;
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

    // Generate follow-up questions based on the response
    const followUpQuestions = await generateFollowUpQuestions(botResponse, finalImageUrl);
    
    return new Response(
      JSON.stringify({ 
        response: botResponse,
        followUpQuestions 
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
      JSON.stringify({ 
        response: fallbackResponse,
        followUpQuestions: generateFallbackQuestions(false)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Function to generate contextual follow-up questions
async function generateFollowUpQuestions(response: string, imageUrl?: string): Promise<string[]> {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const followUpPrompt = `Based on this palmistry response: "${response}"
    
Generate 2-3 short, engaging follow-up questions that a user might naturally ask next. 
${imageUrl ? 'Consider that this is about a palm reading with an image.' : ''}

The questions should be:
- Brief (under 10 words each)
- Naturally curious and engaging
- Related to palmistry, destiny, or life guidance
- Actionable (can be answered with palm reading knowledge)

Examples of good follow-up questions:
- "What about my love life timeline?"
- "When will I find success?"
- "Are there any warning signs?"
- "What should I focus on this year?"
- "How can I strengthen my destiny?"

Return only the questions as a JSON array of strings, nothing else.`;

    const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates follow-up questions. Return only valid JSON arrays.' },
          { role: 'user', content: followUpPrompt }
        ],
        max_tokens: 150,
        temperature: 0.7,
      }),
    });

    const followUpData = await followUpResponse.json();
    const questionsText = followUpData.choices[0].message.content.trim();
    
    try {
      const questions = JSON.parse(questionsText);
      return Array.isArray(questions) ? questions.slice(0, 3) : [];
    } catch {
      // Fallback questions if JSON parsing fails
      return generateFallbackQuestions(!!imageUrl);
    }
  } catch (error) {
    console.error('Error generating follow-up questions:', error);
    return generateFallbackQuestions(!!imageUrl);
  }
}

// Fallback questions based on context
function generateFallbackQuestions(imageUrl: boolean): string[] {
  const palmQuestions = [
    "What about my love life?",
    "When will I find success?",
    "Any health insights?"
  ];
  
  const generalQuestions = [
    "Tell me about my destiny",
    "What should I focus on?",
    "Any upcoming changes?"
  ];
  
  return imageUrl ? palmQuestions : generalQuestions;
}