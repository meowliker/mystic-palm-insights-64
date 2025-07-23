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
  "Will I be poor or rich?", 
  "When will I get a job?",
  "Will I get divorced?",
  "What does my heart line say about my relationships?",
  "What does my fate line reveal about my destiny?",
  "What does my head line suggest about my intelligence?",
  "What can I learn about my past from my palm?",
  "What do the mounts on my palm mean?",
  "How long will I live based on my life line?"
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
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Hello! I'm Astrobot, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
      sender: 'astrobot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        const fileName = `chat-${Date.now()}-${selectedImage.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('palm-images')
          .upload(fileName, selectedImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('palm-images')
          .getPublicUrl(uploadData.path);
        
        imageUrl = publicUrl;
      }

      // Send to chatbot API
      const { data, error } = await supabase.functions.invoke('astrobot-chat', {
        body: {
          message: inputMessage,
          imageUrl,
          conversationHistory: messages.slice(-10) // Send last 10 messages for context
        }
      });

      if (error) throw error;

      // Clear the uploaded image after successful send
      removeImage();

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: 'astrobot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);

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
      removeImage();
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
    <div className="h-full max-w-4xl mx-auto flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden">
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
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'astrobot' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Sparkles className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Palm image"
                        className="w-full max-w-[200px] rounded-lg mb-2"
                      />
                    )}
                    <p className={`text-sm ${message.isTyping ? 'italic animate-pulse' : ''}`}>
                      {message.content}
                    </p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
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

            {/* Palm guidance */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <p className="font-medium mb-1">📷 Palm Photo Tips:</p>
              <p>• Ensure good lighting • Keep palm flat • Focus on line clarity • Take from directly above</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};