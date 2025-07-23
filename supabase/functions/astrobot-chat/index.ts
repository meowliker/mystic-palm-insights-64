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
- Acknowledge the user's question warmly
- Explain that accurate palmistry requires analyzing actual palm lines
- Request a clear palm photo for a detailed reading
- Provide brief general palmistry information about what you would look for
- Give guidance on how to take a good palm photo

SAMPLE RESPONSES WITHOUT IMAGES:

Marriage Timing: "I need to see your palm to read your marriage timeline! Upload a clear photo of your dominant hand and I'll reveal when love will bloom. 📷✨"

Wealth/Career: "Your financial destiny is written in your palm lines! Upload a photo and I'll read your wealth timeline from your fate line. 💰📷"

General Questions: "To give you accurate insights, I need to see your actual palm lines. Upload a clear photo for a detailed reading! 📷"

WHEN IMAGES ARE PROVIDED:
Give VERY SHORT readings (2-3 lines maximum) with specific insights based on what you see in the palm image. Be concise and mystical.

PALM PHOTO GUIDANCE TO PROVIDE:
1. Use natural lighting or bright indoor light
2. Keep your palm flat and fingers slightly spread
3. Take the photo from directly above
4. Ensure all major lines are clearly visible
5. Focus on your dominant hand (the hand you write with)
6. Make sure the image is in focus and well-lit

GENERAL PALMISTRY KNOWLEDGE (for educational responses):
- Heart Line: Shows emotional life and relationships
- Head Line: Reveals intelligence and decision-making
- Life Line: Indicates vitality and life path  
- Fate Line: Shows destiny and career path
- Mounts: Raised areas revealing different personality aspects

Be encouraging and mystical while being honest about needing actual palm data for accurate readings.
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

    // Build conversation context
    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .filter((msg: any) => msg.sender !== 'astrobot' || !msg.isTyping)
        .map((msg: any) => `${msg.sender === 'user' ? 'User' : 'Astrobot'}: ${msg.content}`)
        .join('\n');
    }

    let systemPrompt = palmistryKnowledge;

    // If there's an image, analyze it for detailed predictions
    if (imageUrl) {
      systemPrompt += `\n\nThe user has uploaded a palm image. Now you can provide detailed, mystical predictions! Analyze the image carefully and give specific insights about timing, relationships, career, wealth, and destiny based on what you can actually see in their palm lines, mounts, and markings.`;
    } else {
      systemPrompt += `\n\nNo palm image provided. Be helpful but honest - explain that you need to see their actual palm to give specific predictions. Request a photo and provide guidance on taking good palm images. You can share general palmistry knowledge but avoid specific predictions without visual data.`;
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
      model: "gpt-4o",
      messages: messages,
      max_tokens: 1000,
      temperature: 0.7
    };

    // Add image if provided
    if (imageUrl) {
      try {
        console.log('Fetching image for base64 conversion:', imageUrl);
        
        // Fetch the image and convert to base64
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
      hasImage: !!imageUrl, 
      messageLength: message?.length || 0,
      imageUrl: imageUrl ? imageUrl.substring(0, 100) + '...' : 'none'
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

    // Only add brief suggestions, not long explanations
    if (imageUrl && imageUrl.trim() !== '') {
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