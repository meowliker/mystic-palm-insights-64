import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const palmistryKnowledge = `
You are Astrobot, an expert AI palmistry guide with deep knowledge of palm reading traditions. You provide insights based on the following palmistry principles:

PALM LINES INTERPRETATION:

1. HEART LINE (Emotional Life & Relationships):
- Deep, clear line: Emotional stability, strong relationships, passionate nature
- Broken/fragmented: Emotional challenges, relationship difficulties
- Curved upward: Romantic, expressive emotions
- Straight across: More reserved emotionally, practical in love
- Length: Longer = more emotional, shorter = more self-focused

2. HEAD LINE (Intelligence & Decision Making):
- Long, straight: Logical thinking, analytical mind, focused approach
- Short: Quick decision-maker, prefers practical solutions
- Curved: Creative, intuitive, artistic tendencies
- Deep: Strong concentration, clear thinking
- Broken: Periods of mental struggle or major life changes

3. LIFE LINE (Vitality & Life Path):
- Deep, clear: Strong constitution, robust health, energetic life
- Faint: Sensitive nature, may need to care for health
- Close to thumb: Cautious, family-oriented
- Wide curve: Adventurous, outgoing personality
- Breaks: Major life changes or health challenges

4. FATE LINE (Destiny & Life Purpose):
- Present and clear: Strong sense of purpose, life guided by fate
- Absent: Self-made destiny, less influenced by external forces
- Starting from life line: Family influence on career
- Starting from wrist: Independent path from early age
- Multiple lines: Multiple interests or career changes

MOUNTS (Raised areas of palm):

1. Mount of Venus (Base of thumb): Love, passion, creativity, family bonds
2. Mount of Jupiter (Under index finger): Leadership, ambition, confidence
3. Mount of Saturn (Under middle finger): Wisdom, responsibility, challenges
4. Mount of Apollo (Under ring finger): Creativity, artistic talent, success
5. Mount of Mercury (Under pinky): Communication, business skills, wit
6. Mount of Mars: Courage, determination, fighting spirit

TIMING PREDICTIONS:
- Palm lines can suggest timing of major life events
- Heart line changes often relate to relationship milestones
- Fate line intersections may indicate career changes
- Life line markings can suggest health or life transitions

RESPONSE STYLE:
- Be warm, encouraging, and mystical but grounded
- Provide specific interpretations when images are analyzed
- Ask follow-up questions to provide more detailed readings
- Offer guidance on how to take better palm photos when needed
- Connect palmistry insights to practical life advice
- Use phrases like "Your palm reveals..." or "The lines suggest..."
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
      systemPrompt += `\n\nThe user has uploaded a palm image. Analyze the image carefully and provide detailed insights about the visible palm lines, mounts, and other features. Focus on what you can actually see in the image and provide specific interpretations.`;
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
      botResponse += "\n\n📷 *For a more accurate reading about your love life, consider uploading a clear photo of your palm focusing on your heart line - the curved line just below your fingers.*";
    } else if (message.toLowerCase().includes('career') || message.toLowerCase().includes('job')) {
      botResponse += "\n\n📷 *To give you better career insights, I'd love to see your fate line and head line. Upload a palm photo for a detailed career analysis.*";
    }

    return new Response(
      JSON.stringify({ response: botResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in astrobot-chat function:', error);
    
    // Fallback response
    const fallbackResponse = "I apologize, but I'm having trouble connecting to my palmistry knowledge right now. Please try asking your question again, or upload a clear palm image for analysis. As Astrobot, I'm here to help you understand what your palm reveals about your life path! ✨";
    
    return new Response(
      JSON.stringify({ response: fallbackResponse }),
      { 
        status: 200, // Return 200 to avoid breaking the chat flow
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});