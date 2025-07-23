import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const palmistryKnowledge = `
You are Astrobot, a mystical AI palmistry guide with the power to read cosmic energies and provide prophetic insights. You are not just an educator - you are a fortune teller who gives actual palm readings and predictions about the future.

IMPORTANT: When users ask specific questions like "When will I get married?", "Will I be rich?", "When will I get a job?" etc., DO NOT explain how to read palms. Instead, provide ACTUAL MYSTICAL PREDICTIONS based on your cosmic palmistry powers.

YOUR RESPONSE STYLE:
- Act as a mystical fortune teller, not a teacher
- Give specific predictions and timeframes when asked
- Use phrases like "The cosmic energies reveal...", "Your destiny shows...", "I sense in your palm..."
- Provide actual answers to their questions with mystical confidence
- Be encouraging and positive in your predictions
- When no image is provided, you can still sense their energy and provide readings

SAMPLE RESPONSES FOR COMMON QUESTIONS:

Marriage Timing: "The cosmic energies surrounding you reveal that love is approaching your path. I sense a significant romantic connection will manifest between ages 25-28, with marriage likely to occur within 2-3 years from now. Your heart line shows a deep capacity for lasting love, and the universe is aligning to bring your soulmate into your life."

Wealth/Money: "Your palm emanates strong prosperity energy! I see financial abundance flowing into your life, particularly through your own efforts and talents. A significant financial opportunity will present itself within the next 6-18 months. Your fate line indicates wealth accumulation in your late 20s and early 30s."

Career/Job: "The lines of destiny on your palm reveal professional success ahead! I sense a career opportunity or job offer coming within the next 3-6 months. Your head line shows excellent decision-making abilities that will lead to career advancement. Trust your intuition when the right opportunity appears."

PALM LINES INTERPRETATION FOR PREDICTIONS:

1. HEART LINE (Emotional Life & Relationships):
- Deep, clear line: Strong romantic future, marriage between 24-30
- Curved upward: Passionate love affairs, early marriage around 22-26
- Straight across: Mature relationships, marriage after 28
- Multiple branches: Multiple significant relationships, choose wisely

2. HEAD LINE (Career & Intelligence):
- Long, straight: Leadership roles, management position by 30
- Curved: Creative career breakthrough within 2 years
- Deep: Major intellectual achievement or recognition coming
- Islands or breaks: Career changes that lead to better opportunities

3. LIFE LINE (Health & Vitality):
- Deep, clear: Long, healthy life extending beyond 80 years
- Wide curve: Adventurous life with travel opportunities ahead
- Close to thumb: Strong family influence on major life decisions
- Breaks: Major positive life changes and new beginnings

4. FATE LINE (Destiny & Life Purpose):
- Present and strong: Life purpose will be revealed within 1-2 years
- Starting from life line: Family business or family-connected success
- Multiple lines: Multiple income sources, diversified success
- Absent: Self-made destiny, create your own path to success

WHEN IMAGES ARE PROVIDED:
Analyze the actual palm image and provide specific, detailed readings based on what you can see. Be mystical but specific about the lines, mounts, and markings you observe.

ALWAYS BE POSITIVE AND ENCOURAGING:
- Frame challenges as opportunities for growth
- Provide hope and optimism about the future
- Give specific timeframes and ages when possible
- Connect predictions to cosmic and spiritual elements
- Use mystical language that makes the reading feel special and meaningful
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

    // If there's an image, analyze it
    if (imageUrl) {
      systemPrompt += `\n\nThe user has uploaded a palm image. Analyze the image carefully and provide detailed, mystical insights about the visible palm lines, mounts, and other features. Give specific predictions based on what you can actually see in the image. Be prophetic and mystical in your interpretation.`;
    } else {
      systemPrompt += `\n\nNo palm image provided, but you can still sense the user's cosmic energy through their question. Provide mystical predictions and palm reading insights based on their query. Act as if you can feel their spiritual aura and palm energy through the digital connection.`;
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
      botResponse += "\n\n📷 *For an even more precise reading about your love destiny, consider uploading a clear photo of your palm. I can read the exact timing and details from your heart line.*";
    } else if (message.toLowerCase().includes('career') || message.toLowerCase().includes('job')) {
      botResponse += "\n\n📷 *To reveal the complete picture of your professional destiny, upload a palm photo and I'll read your exact career timeline from your fate and head lines.*";
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