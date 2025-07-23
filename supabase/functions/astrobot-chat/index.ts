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

Marriage Timing: "I'd love to help you discover when love will bloom in your life! To provide an accurate reading about your marriage timeline, I need to analyze your actual heart line and other palm features. Please upload a clear, well-lit photo of your dominant hand's palm, and I'll read the cosmic messages written in your lines. ✨📷"

Wealth/Career: "Your financial destiny is written in your palm lines! To give you specific insights about wealth and career timing, I need to examine your fate line, head line, and the mounts on your palm. Upload a photo and I'll reveal what the universe has planned for your prosperity! 💰✨"

General Questions: "That's a wonderful question! Palm reading is most accurate when I can see your actual palm lines. Please share a clear photo of your palm, and I'll provide detailed insights based on what I observe in your unique hand patterns."

WHEN IMAGES ARE PROVIDED:
Now give detailed, mystical readings with specific predictions, timeframes, and cosmic insights based on what you can actually see in the palm image.

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
              url: imageUrl,
              detail: "high"
            }
          }
        ]
      };
    }

    console.log('Sending request to OpenAI...');
    
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
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    let botResponse = data.choices[0].message.content;

    // Enhance response with actionable suggestions
    if (imageUrl) {
      botResponse += "\n\n✨ *Would you like me to focus on any specific aspect of your palm? I can provide more detailed insights about your relationships, career, health, or spiritual path.*";
    } else if (message.toLowerCase().includes('marriage') || message.toLowerCase().includes('relationship')) {
      botResponse += "\n\n📷 *For a precise reading about your love destiny, click the help button (?) next to the camera icon to see how to take the perfect palm photo. I'll read the exact timing and details from your heart line.*";
    } else if (message.toLowerCase().includes('career') || message.toLowerCase().includes('job') || message.toLowerCase().includes('money') || message.toLowerCase().includes('rich')) {
      botResponse += "\n\n📷 *To reveal your complete financial and career destiny, upload a clear palm photo. Click the help button (?) for photography guidance, then I'll read your exact timeline from your fate and head lines.*";
    } else {
      botResponse += "\n\n📷 *For the most accurate reading, please upload a clear photo of your palm. Click the help button (?) next to the camera icon for detailed photography guidance.*";
    }

    return new Response(
      JSON.stringify({ response: botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in astrobot-chat function:', error);
    
    // Fallback response with mystical fortune-telling style
    const fallbackResponse = "The cosmic energies are momentarily clouded, but I sense great potential in your destiny! Please try asking your question again, and I'll channel my mystical powers to reveal what your palm holds for your future. ✨🔮";
    
    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      { 
        status: 200, // Return 200 to avoid breaking the chat flow
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});