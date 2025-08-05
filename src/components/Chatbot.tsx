import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Send, Sparkles, Camera, Image, HelpCircle, Book } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { PalmGuide } from '@/components/PalmGuide';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'astrobot';
  timestamp: Date;
  imageUrl?: string;
  isTyping?: boolean;
}

const prebuiltQuestions = [
  "When will I get married?",
  "Will I be rich?",
  "What's my love life going to be like?",
  "When will I find my soulmate?",
  "What does my career future look like?",
  "How is my health according to my palm?",
  "What does my life line say?",
  "Do I have children in my future?",
  "What challenges will I face?",
  "What are my hidden talents?"
];

const palmGuidanceInstructions = {
  heartLine: "Focus on the curved line that runs horizontally across the upper part of your palm, just below your fingers.",
  fateLine: "Look for the vertical line that may run from the bottom of your palm towards your middle finger.",
  headLine: "Capture the line that runs horizontally across the middle of your palm.",
  lifeLine: "Focus on the curved line that wraps around the base of your thumb.",
  mounts: "Take a clear photo showing the raised areas under each finger and on your palm.",
  fullPalm: "Take a clear, well-lit photo of your entire palm from directly above."
};

export const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Load chat history on component mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    } else {
      // If not authenticated, show welcome message
      setMessages([{
        id: '1',
        content: "Hello! I'm Astrobot, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
        sender: 'astrobot',
        timestamp: new Date()
      }]);
      setIsLoadingHistory(false);
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatHistory = async () => {
    if (!user) return;

    try {
      setIsLoadingHistory(true);
      
      // Get or create session and load messages in one optimized query
      let { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          chat_messages (
            id,
            content,
            sender,
            created_at,
            image_url
          )
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      let currentSessionId: string;
      let existingMessages: any[] = [];
      
      if (sessions && sessions.length > 0) {
        currentSessionId = sessions[0].id;
        existingMessages = sessions[0].chat_messages || [];
      } else {
        // Create a new session only if none exists
        const { data: newSession, error: createError } = await supabase
          .from('chat_sessions')
          .insert({
            user_id: user.id,
            session_name: 'Astrobot Chat'
          })
          .select()
          .single();

        if (createError) throw createError;
        currentSessionId = newSession.id;
      }

      setSessionId(currentSessionId);

      if (existingMessages.length > 0) {
        // Sort messages by creation time
        const sortedMessages = existingMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const loadedMessages: Message[] = sortedMessages.map(msg => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender as 'user' | 'astrobot',
          timestamp: new Date(msg.created_at),
          imageUrl: msg.image_url || undefined
        }));
        setMessages(loadedMessages);
      } else {
        // If no messages, just add welcome message locally (don't save immediately)
        const welcomeMessage = {
          id: 'welcome-' + Date.now(),
          content: "Hello! I'm Astrobot, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
          sender: 'astrobot' as const,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
      }

    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show welcome message on error
      const welcomeMessage = {
        id: 'welcome-error-' + Date.now(),
        content: "Hello! I'm Astrobot, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
        sender: 'astrobot' as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveMessageToHistory = async (message: Message) => {
    if (!sessionId || !user) return;

    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          content: message.content,
          sender: message.sender,
          image_url: message.imageUrl || null
        });

      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error saving message to history:', error);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imagePreview || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    removeImage(); // Clear the image immediately after sending

    // Save user message to history
    if (user) {
      await saveMessageToHistory(userMessage);
    }

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      content: 'Astrobot is analyzing...',
      sender: 'astrobot',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    setIsLoading(true);

    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        console.log('Uploading image:', selectedImage.name);
        const fileName = `chat-${Date.now()}-${selectedImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('palm-images')
          .upload(fileName, selectedImage);

        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('palm-images')
          .getPublicUrl(uploadData.path);
        
        imageUrl = publicUrl;
        console.log('Image uploaded successfully:', imageUrl);
      }

      console.log('Sending message to astrobot-chat:', { 
        message: inputMessage, 
        hasImage: !!imageUrl,
        imageUrl: imageUrl?.substring(0, 50)
      });

      // Send to chatbot API
      const { data, error } = await supabase.functions.invoke('astrobot-chat', {
        body: {
          message: inputMessage,
          imageUrl,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }
      });

      console.log('Astrobot response:', { data, error });

      if (error) {
        console.error('Astrobot function error:', error);
        throw error;
      }

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'astrobot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);

      // Save bot response to history
      if (user) {
        await saveMessageToHistory(botResponse);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuestionClick = (question: string) => {
    setInputMessage(question);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-full w-full flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Astrobot - Your AI Palmistry Guide
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
          {/* Pre-built questions */}
          <div className="p-4 border-b bg-muted/20">
            <div className="flex flex-wrap gap-2">
              {prebuiltQuestions.slice(0, 4).map((question, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => handleQuestionClick(question)}
                >
                  {question}
                </Badge>
              ))}
            </div>
          </div>

          {/* Chat messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">Loading chat history...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => {
                  // Check if we need to show a date separator
                  const showDateSeparator = index === 0 || 
                    message.timestamp.toDateString() !== messages[index - 1].timestamp.toDateString();
                  
                  return (
                    <div key={message.id}>
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="bg-muted/80 px-3 py-1 rounded-full text-xs text-muted-foreground">
                            {message.timestamp.toLocaleDateString('en-GB', { 
                              day: 'numeric', 
                              month: 'short', 
                              year: 'numeric' 
                            })}
                          </div>
                        </div>
                      )}
                      
                      <div
                        className={`flex gap-3 mb-4 ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        {message.sender === 'astrobot' && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Sparkles className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`max-w-[85%] md:max-w-[80%] lg:max-w-[75%] rounded-lg p-4 ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Palm image"
                              className="w-full max-w-[200px] rounded-lg mb-3"
                            />
                          )}
                          
                          {message.sender === 'user' ? (
                            // User message - simple formatting
                            <div className="text-sm">
                              <p className="leading-relaxed">{message.content}</p>
                            </div>
                          ) : (
                            // Bot message - enhanced formatting
                            <div className={`text-sm ${message.isTyping ? 'italic animate-pulse' : ''}`}>
                              {message.content.split('\n').map((line, index) => {
                                // Add emoji mapping for common keywords
                                const addEmojis = (text: string) => {
                                  return text
                                    .replace(/\bmarriage\b/gi, '💍 marriage')
                                    .replace(/\bmarried?\b/gi, '💒 married')
                                    .replace(/\blove\b/gi, '❤️ love')
                                    .replace(/\bheart\b/gi, '💖 heart')
                                    .replace(/\brelationship\b/gi, '💕 relationship')
                                    .replace(/\bmoney\b/gi, '💰 money')
                                    .replace(/\brich\b/gi, '💎 rich')
                                    .replace(/\bwealth\b/gi, '💰 wealth')
                                    .replace(/\bcareer\b/gi, '🏆 career')
                                    .replace(/\bjob\b/gi, '💼 job')
                                    .replace(/\bhealth\b/gi, '🌿 health')
                                    .replace(/\blife\b/gi, '🌟 life')
                                    .replace(/\bfuture\b/gi, '🔮 future')
                                    .replace(/\bchildren\b/gi, '👶 children')
                                    .replace(/\bfamily\b/gi, '👨‍👩‍👧‍👦 family')
                                    .replace(/\bchallenge\b/gi, '⚡ challenge')
                                    .replace(/\btalent\b/gi, '✨ talent')
                                    .replace(/\bsuccess\b/gi, '🎯 success')
                                    .replace(/\benergy\b/gi, '⚡ energy')
                                    .replace(/\bspiritual\b/gi, '🕯️ spiritual')
                                    .replace(/\bwisdom\b/gi, '🦉 wisdom')
                                    .replace(/\bdestiny\b/gi, '🌟 destiny')
                                    .replace(/\bfate\b/gi, '🔮 fate');
                                };

                                // Handle headers (lines starting with ##)
                                if (line.startsWith('## ')) {
                                  return (
                                    <div key={index}>
                                      <div className="mb-3 mt-4 border-b border-primary/20 pb-2">
                                        <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                                          🔮 {line.replace('## ', '')}
                                        </h3>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Handle subheaders (lines starting with #)
                                if (line.startsWith('# ')) {
                                  return (
                                    <div key={index}>
                                      <div className="mb-2 mt-3">
                                        <h4 className="font-semibold text-base text-cosmic-purple flex items-center gap-2">
                                          ✨ {line.replace('# ', '')}
                                        </h4>
                                      </div>
                                    </div>
                                  );
                                }
                                
                                // Handle bullet points
                                if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                                  const cleanLine = line.replace(/^[•\-]\s*/, '');
                                  return (
                                    <div key={index} className="ml-4 mb-2 flex items-start gap-3 py-1">
                                      <span className="text-cosmic-blue text-lg mt-0.5">🔹</span>
                                      <span className="leading-relaxed">{addEmojis(cleanLine)}</span>
                                    </div>
                                  );
                                }
                                
                                // Handle numbered lists
                                if (line.trim().match(/^\d+\.\s/)) {
                                  const number = line.match(/^\d+/)?.[0];
                                  const content = line.replace(/^\d+\.\s*/, '');
                                  return (
                                    <div key={index} className="ml-4 mb-2 flex items-start gap-3 py-1">
                                      <span className="text-cosmic-purple font-bold text-sm bg-cosmic-purple/10 rounded-full w-6 h-6 flex items-center justify-center mt-0.5">
                                        {number}
                                      </span>
                                      <span className="leading-relaxed">{addEmojis(content)}</span>
                                    </div>
                                  );
                                }
                                
                                // Handle bold text (**text**)
                                if (line.includes('**')) {
                                  const parts = line.split(/(\*\*.*?\*\*)/g);
                                  return (
                                    <div key={index} className={line.trim() === '' ? 'mb-3' : 'mb-2'}>
                                      <p className="leading-relaxed">
                                        {parts.map((part, partIndex) => {
                                          if (part.startsWith('**') && part.endsWith('**')) {
                                            return (
                                              <strong key={partIndex} className="font-bold text-cosmic-purple bg-cosmic-purple/5 px-1 rounded">
                                                {addEmojis(part.slice(2, -2))}
                                              </strong>
                                            );
                                          }
                                          return addEmojis(part);
                                        })}
                                      </p>
                                    </div>
                                  );
                                }
                                
                                // Handle questions (lines ending with ?)
                                if (line.trim().endsWith('?')) {
                                  return (
                                    <div key={index} className="mb-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                                      <p className="leading-relaxed font-medium text-primary">
                                        💭 {addEmojis(line)}
                                      </p>
                                    </div>
                                  );
                                }
                                
                                // Regular paragraphs
                                if (line.trim() === '') {
                                  return <div key={index} className="mb-3" />;
                                }
                                
                                return (
                                  <div key={index} className="mb-2">
                                    <p className="leading-relaxed">
                                      {addEmojis(line)}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className="text-xs opacity-70 mt-2 flex justify-between items-center">
                            <span>
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          </div>
                        </div>
                        
                        {message.sender === 'user' && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarFallback className="bg-muted text-muted-foreground">U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Fixed input area at bottom */}
          <div className="border-t bg-background p-4 space-y-4">
            {/* Image preview */}
            {imagePreview && (
              <div className="relative w-fit">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeImage}
                >
                  ×
                </Button>
              </div>
            )}

            {/* Input area */}
            <div className="flex gap-2">
              <div className="flex-1 flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your palm lines or upload an image..."
                  disabled={isLoading}
                  className="flex-1"
                />
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                      title="Palm Photo Guide"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <PalmGuide />
                  </DialogContent>
                </Dialog>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Upload Palm Image"
                >
                  <Camera className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || (!inputMessage.trim() && !selectedImage)}
                  size="icon"
                  title="Send Message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
};