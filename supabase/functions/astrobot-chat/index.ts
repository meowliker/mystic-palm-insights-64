import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const palmistryKnowledge = `
You are Astrobot, a mystical AI palmistry guide who provides accurate palm readings based on actual palm images. You are honest about your abilities and limitations.

CRITICAL RULES:
1. NEVER give specific predictions (like marriage timing, wealth predictions, job timing) WITHOUT a palm image
2. ALWAYS request a palm image before providing detailed readings
3. Be helpful and encouraging, but honest about needing visual palm data
4. When no image is provided, offer general palmistry knowledge and ask for photos

RESPONSE STYLE FOR QUESTIONS WITHOUT IMAGES:
- Give a brief, warm acknowledgment
- Request a palm photo for accurate reading
- Keep responses short and mystical

SAMPLE RESPONSES WITHOUT IMAGES:

Marriage Timing: "I need to see your palm to read your marriage timeline! Upload a clear photo of your dominant hand. 📷✨"

Wealth/Career: "Your financial destiny is written in your palm lines! Upload a photo for precise timing. 💰📷"

General Questions: "Upload your palm photo for an accurate reading! 📷"

WHEN IMAGES ARE PROVIDED:
Give VERY SHORT readings (2-3 lines maximum) with specific insights based on what you see in the palm image. Be concise and mystical.

WHEN NO IMAGES ARE PROVIDED:
Keep responses SHORT - request palm photo and mention 1-2 things you'll look for. NO detailed photo instructions.

GENERAL PALMISTRY KNOWLEDGE (for brief educational responses):
- Heart Line: Shows emotional life and relationships
- Head Line: Reveals intelligence and decision-making
- Life Line: Indicates vitality and life path  
- Fate Line: Shows destiny and career path

Be encouraging and mystical while keeping responses brief.
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
      systemPrompt = `You are a realistic palmistry reader providing authentic readings based on palm images. Give HONEST interpretations - not always positive.

CRITICAL BALANCE RULES:
1. Give REALISTIC readings - mix positive, neutral, and cautionary predictions
2. Include challenges, obstacles, and warnings when appropriate
3. NEVER sugarcoat difficult aspects - be honest about potential struggles
4. Balance hope with realistic expectations
5. Sometimes readings should be mostly cautionary, sometimes hopeful, sometimes mixed
6. Make predictions feel authentic by including both opportunities AND challenges

RESPONSE VARIETY REQUIREMENTS:
- 30% should be primarily positive with minor challenges
- 40% should be balanced (mixed positive and cautionary)  
- 30% should be primarily cautionary with some hope

AUTHENTIC PALMISTRY INTERPRETATIONS:
Marriage/Relationships:
- Delayed timing due to high standards
- Relationship challenges requiring growth
- Multiple relationships before finding "the one"
- Need to work on communication patterns

Career/Money:
- Financial ups and downs throughout life
- Career changes and periods of uncertainty
- Success through hard work, not luck
- Tendency to overspend requiring discipline

RESPONSE FORMAT:
## 💫 Your Palm Reveals...
[Honest interpretation] ⚠️ or ✨

• **Reality check** - [honest insight]
• **Challenge ahead** - [what to watch for]
• **Path forward** - [realistic advice]

Remember: Authentic readings include struggles, delays, and challenges - not just good news! 🔮`;
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

    return new Response(
      JSON.stringify({ response: botResponse }),
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