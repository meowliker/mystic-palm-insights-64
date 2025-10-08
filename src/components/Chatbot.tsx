import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Upload, Send, Sparkles, Camera, Image, HelpCircle, Book, Copy, MessageSquare, Heart, ThumbsUp, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { PalmGuide } from '@/components/PalmGuide';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'elysia';
  timestamp: Date;
  imageUrl?: string;
  isTyping?: boolean;
  followUpQuestions?: string[];
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
  const location = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasProcessedNavigation, setHasProcessedNavigation] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const followUpQuestionsRef = useRef<HTMLDivElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();
  
  // Prevent duplicate history loads/flicker
  const hasLoadedHistoryRef = useRef(false);
  const loadingHistoryRef = useRef(false);

  // Local cache helpers to prevent history loss if DB fails
  const getCacheKey = () => `elysia:history:${user?.id ?? 'anon'}`;
  const loadFromCache = (): boolean => {
    try {
      const raw = localStorage.getItem(getCacheKey());
      if (!raw) return false;
      const parsed = JSON.parse(raw) as { messages: Array<{ id: string; content: string; sender: 'user'|'elysia'; timestamp: string; imageUrl?: string; followUpQuestions?: string[] }>; sessionId?: string };
      if (parsed.messages && parsed.messages.length) {
        const cachedMessages: Message[] = parsed.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp),
          isTyping: false
        }));
        setMessages(cachedMessages);
        if (parsed.sessionId) setSessionId(parsed.sessionId);
        // Avoid spinner if we have cache
        setIsLoadingHistory(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };
  const scrollToBottom = () => {
    // First try to scroll to follow-up questions if they exist
    if (followUpQuestionsRef.current) {
      setTimeout(() => {
        followUpQuestionsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'end',
          inline: 'nearest'
        });
      }, 100);
    } else if (scrollAreaRef.current) {
      // Otherwise scroll to bottom normally
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }, 100);
      }
    }
  };

  // Load chat history on component mount (run only when user ID changes)
  useEffect(() => {
    // Always try local cache first to avoid empty UI if DB is slow/unavailable
    const hadCache = loadFromCache();

    if (user?.id) {
      hasLoadedHistoryRef.current = false; // allow fresh load for this user
      loadChatHistory();
    } else {
      // If not authenticated and no cache, show welcome message once and avoid flicker
      if (!hadCache) {
        if (!hasLoadedHistoryRef.current) {
          setMessages([{
            id: '1',
            content: "Hello! I'm Elysia, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
            sender: 'elysia',
            timestamp: new Date()
          }]);
          hasLoadedHistoryRef.current = true;
        }
        setIsLoadingHistory(false);
      }
    }
  }, [user?.id]);

  // Handle navigation state from ResultsScreen - only after history is loaded
  useEffect(() => {
    if (isLoadingHistory) return; // Don't process navigation until history is loaded
    
    const navigationState = location.state as any;
    if (navigationState?.question && navigationState?.autoSend && !hasProcessedNavigation) {
      setHasProcessedNavigation(true);
      
      // Set the question in input
      setInputMessage(navigationState.question);
      
      // If palm image is provided, convert it to the expected format
      if (navigationState.palmImage) {
        // Create a mock file object for the palm image
        fetch(navigationState.palmImage)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'palm-reading.jpg', { type: 'image/jpeg' });
            setSelectedImage(file);
            setImagePreview(navigationState.palmImage);
            
            // Auto-send the message after a short delay
            setTimeout(() => {
              sendMessage();
            }, 1000);
          })
          .catch(err => {
            console.error('Error loading palm image:', err);
            // Send message without image if loading fails
            setTimeout(() => {
              sendMessage();
            }, 1000);
          });
      } else {
        // Send message without image
        setTimeout(() => {
          sendMessage();
        }, 1000);
      }
    }
  }, [location.state, hasProcessedNavigation, isLoadingHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist to local cache whenever messages/session change (exclude typing)
  useEffect(() => {
    try {
      const toSave = messages
        .filter(m => !m.isTyping)
        .map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
      localStorage.setItem(getCacheKey(), JSON.stringify({ messages: toSave, sessionId }));
    } catch {}
  }, [messages, sessionId, user?.id]);

  const loadChatHistory = async () => {
    if (!user) return;
    if (loadingHistoryRef.current || hasLoadedHistoryRef.current) return; // prevent duplicate loads
    loadingHistoryRef.current = true;

    try {
      setIsLoadingHistory(true);
      
      // Simplified query to avoid timeouts
      let { data: sessions, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (sessionError) throw sessionError;

      let currentSessionId: string;
      
      if (sessions && sessions.length > 0) {
        currentSessionId = sessions[0].id;
        
        // Load messages separately with timeout protection
        try {
          const { data: messages, error: messagesError } = await supabase
            .from('chat_messages')
            .select('id, content, sender, created_at, image_url, follow_up_questions')
            .eq('session_id', currentSessionId)
            .order('created_at', { ascending: true }); // Remove limit to load all messages

          if (!messagesError && messages && messages.length > 0) {
            const loadedMessages: Message[] = messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              sender: msg.sender as 'user' | 'elysia',
              timestamp: new Date(msg.created_at),
              imageUrl: msg.image_url || undefined,
              followUpQuestions: Array.isArray(msg.follow_up_questions) ? msg.follow_up_questions.filter((q): q is string => typeof q === 'string') : undefined
            }));
            setMessages(loadedMessages);
            setSessionId(currentSessionId);
            return; // Success, exit early
          }
        } catch (messageError) {
          console.error('Error loading messages:', messageError);
          // Continue to create welcome message
        }
      } else {
        // Create a new session only if none exists
        try {
            const { data: newSession, error: createError } = await supabase
            .from('chat_sessions')
            .insert({
              user_id: user.id,
              session_name: 'Elysia Chat'
            })
            .select()
            .single();

          if (!createError) {
            currentSessionId = newSession.id;
            setSessionId(currentSessionId);
          }
        } catch (createError) {
          console.error('Error creating session:', createError);
          // Continue with local session
        }
      }

      // Default welcome message if no messages loaded
      const welcomeMessage = {
        id: 'welcome-' + Date.now(),
        content: "Hello! I'm Elysia, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
        sender: 'elysia' as const,
        timestamp: new Date()
      };
      
      setMessages([welcomeMessage]);
      if (currentSessionId!) {
        setSessionId(currentSessionId);
      }

    } catch (error) {
      console.error('Error loading chat history:', error);
      // Show welcome message on error and continue functionality
      const welcomeMessage = {
        id: 'welcome-error-' + Date.now(),
        content: "Hello! I'm Elysia, your AI palmistry guide. I can help you understand your palm lines and what they reveal about your life, relationships, and future. Feel free to ask me any questions or upload a palm image for analysis!",
        sender: 'elysia' as const,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    } finally {
      setIsLoadingHistory(false);
      loadingHistoryRef.current = false;
      hasLoadedHistoryRef.current = true;
    }
  };

  const saveMessageToHistory = async (message: Message) => {
    if (!sessionId || !user) return;

    try {
      await Promise.race([
        supabase
          .from('chat_messages')
          .insert({
            session_id: sessionId,
            content: message.content,
            sender: message.sender,
            image_url: message.imageUrl || null,
            follow_up_questions: message.followUpQuestions || null
          }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Save timeout')), 5000)
        )
      ]);

      // Optimistically append to history in memory (do not reload)
      // Update session timestamp with timeout protection
      await Promise.race([
        supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', sessionId),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Update timeout')), 3000)
        )
      ]);

    } catch (error) {
      console.error('Error saving message to history (will continue with local state):', error);
      // Don't throw error - continue with local state management
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
    if (libraryInputRef.current) {
      libraryInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      setCameraStream(stream);
      setShowCameraModal(true);
      
      // Wait for the modal to open and video element to be available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(console.error);
        }
      }, 100);
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Opening photo library instead.",
      });
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const captureImage = () => {
    if (videoRef.current && cameraStream) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          
          const syntheticEvent = {
            target: { files: dataTransfer.files }
          } as React.ChangeEvent<HTMLInputElement>;
          
          handleImageUpload(syntheticEvent);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && !selectedImage) return;

    // Save the input message before clearing it
    const messageToSend = inputMessage;
    const imageToSend = selectedImage;
    const imagePreviewToSend = imagePreview;

    // Create user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      sender: 'user',
      timestamp: new Date(),
      imageUrl: imagePreviewToSend || undefined
    };

    // Clear input immediately
    setInputMessage('');
    removeImage();
    setIsLoading(true);
    
    // Add user message first and save to database
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage];
      
      // Save user message to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(userMessage).catch(console.error);
      }
      
      return newMessages;
    });

    // Small delay to ensure user message is rendered before typing indicator
    await new Promise(resolve => setTimeout(resolve, 50));

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing-' + Date.now(),
      content: 'Elysia is analyzing...',
      sender: 'elysia',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prevMessages => [...prevMessages, typingMessage]);

    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (imageToSend) {
        console.log('Uploading image:', imageToSend.name);
        const fileName = `chat-${Date.now()}-${imageToSend.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('palm-images')
          .upload(fileName, imageToSend);

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

      console.log('Sending message to elysia-chat:', { 
        message: messageToSend, 
        hasImage: !!imageUrl,
        imageUrl: imageUrl ? imageUrl.substring(0, 50) : 'none'
      });

      // Detect if user provided age - update their profile birthdate
      const ageMatch = messageToSend.match(/\b(\d{2})\b/);
      if (ageMatch && user) {
        const detectedAge = parseInt(ageMatch[1]);
        if (detectedAge >= 10 && detectedAge <= 99) {
          const currentYear = new Date().getFullYear();
          const birthYear = currentYear - detectedAge;
          const birthdate = `${birthYear}-01-01`;
          
          await supabase
            .from('profiles')
            .update({ birthdate })
            .eq('id', user.id);
          
          console.log('Updated user birthdate based on age:', detectedAge);
        }
      }

      // If this is a question about timing, store it
      const timingQuestions = ['marry', 'marriage', 'rich', 'wealth', 'money', 'career', 'job', 'love', 'relationship', 'children', 'health'];
      if (timingQuestions.some(keyword => messageToSend.toLowerCase().includes(keyword))) {
        setLastQuestion(messageToSend);
      }

      // Send to chatbot API
      const { data, error } = await supabase.functions.invoke('elysia-chat', {
        body: {
          message: messageToSend,
          imageUrl,
          conversationHistory: messages.slice(-10), // Send last 10 messages for context
          lastQuestion
        }
      });

      console.log('Elysia response:', { data, error });

      if (error) {
        console.error('Elysia function error:', error);
        throw error;
      }

      // Create bot response
      const botResponse: Message = {
        id: 'bot-' + Date.now(),
        content: data.response,
        sender: 'elysia',
        timestamp: new Date(),
        followUpQuestions: data.followUpQuestions || []
      };

      // Remove typing indicator and add bot response atomically
      setMessages(prevMessages => {
        const messagesWithoutTyping = prevMessages.filter(msg => !msg.id.startsWith('typing-'));
        return [...messagesWithoutTyping, botResponse];
      });

      // Save bot response to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(botResponse).catch(console.error);
      }
      
      // Scroll after message is added
      scrollToBottom();

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      // Remove typing indicator on error
      setMessages(prevMessages => prevMessages.filter(msg => !msg.id.startsWith('typing-')));
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Response copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleThumbsUp = (messageId: string) => {
    toast({
      title: "Thanks for the feedback! 👍",
      description: "Glad you found this reading helpful!",
    });
  };

  const handleFollowUpQuestion = async (question: string) => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    // Create user message for the follow-up question
    const userMessage: Message = {
      id: 'followup-user-' + Date.now(),
      content: question,
      sender: 'user',
      timestamp: new Date()
    };

    setIsLoading(true);

    // Add user message
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage];
      
      // Save user message to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(userMessage).catch(console.error);
      }
      
      return newMessages;
    });

    // Small delay to ensure user message is rendered
    await new Promise(resolve => setTimeout(resolve, 50));

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing-followup-' + Date.now(),
      content: 'Elysia is analyzing...',
      sender: 'elysia',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prevMessages => [...prevMessages, typingMessage]);

    try {
      console.log('Sending follow-up question to elysia-chat:', question);

      // Send to chatbot API
      const { data, error } = await supabase.functions.invoke('elysia-chat', {
        body: {
          message: question,
          imageUrl: null,
          conversationHistory: messages.slice(-10)
        }
      });

      console.log('Elysia response:', { data, error });

      if (error) {
        console.error('Elysia function error:', error);
        throw error;
      }

      // Create bot response
      const botResponse: Message = {
        id: 'bot-followup-' + Date.now(),
        content: data.response,
        sender: 'elysia',
        timestamp: new Date(),
        followUpQuestions: data.followUpQuestions || []
      };

      // Remove typing indicator and add bot response atomically
      setMessages(prevMessages => {
        const messagesWithoutTyping = prevMessages.filter(msg => !msg.id.startsWith('typing-'));
        return [...messagesWithoutTyping, botResponse];
      });

      // Save bot response to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(botResponse).catch(console.error);
      }
      
      // Scroll after message is added
      scrollToBottom();

    } catch (error) {
      console.error('Error sending follow-up question:', error);
      toast({
        title: "Error",
        description: "Failed to send question. Please try again.",
        variant: "destructive"
      });
      
      // Remove typing indicator on error
      setMessages(prevMessages => prevMessages.filter(msg => !msg.id.startsWith('typing-')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickResponse = async (response: string) => {
    if (isLoading) return; // Prevent multiple simultaneous requests
    
    // Create user message for the quick response
    const userMessage: Message = {
      id: 'quick-response-' + Date.now(),
      content: response,
      sender: 'user',
      timestamp: new Date()
    };

    setIsLoading(true);

    // Add user message
    setMessages(prevMessages => {
      const newMessages = [...prevMessages, userMessage];
      
      // Save user message to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(userMessage).catch(console.error);
      }
      
      return newMessages;
    });

    // Small delay to ensure user message is rendered
    await new Promise(resolve => setTimeout(resolve, 50));

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing-quick-' + Date.now(),
      content: 'Elysia is analyzing...',
      sender: 'elysia',
      timestamp: new Date(),
      isTyping: true
    };

    setMessages(prevMessages => [...prevMessages, typingMessage]);

    try {
      console.log('Sending quick response to elysia-chat:', response);

      // Send to chatbot API
      const { data, error } = await supabase.functions.invoke('elysia-chat', {
        body: {
          message: response,
          imageUrl: null,
          conversationHistory: messages.slice(-10)
        }
      });

      console.log('Elysia response:', { data, error });

      if (error) {
        console.error('Elysia function error:', error);
        throw error;
      }

      // Create bot response
      const botResponse: Message = {
        id: 'bot-quick-' + Date.now(),
        content: data.response,
        sender: 'elysia',
        timestamp: new Date(),
        followUpQuestions: data.followUpQuestions || []
      };

      // Remove typing indicator and add bot response atomically
      setMessages(prevMessages => {
        const messagesWithoutTyping = prevMessages.filter(msg => !msg.id.startsWith('typing-'));
        return [...messagesWithoutTyping, botResponse];
      });

      // Save bot response to history (don't await to avoid blocking UI)
      if (user) {
        saveMessageToHistory(botResponse).catch(console.error);
      }

    } catch (error) {
      console.error('Error sending quick response:', error);
      toast({
        title: "Error",
        description: "Failed to send response. Please try again.",
        variant: "destructive"
      });
      
      // Remove typing indicator on error
      setMessages(prevMessages => prevMessages.filter(msg => !msg.id.startsWith('typing-')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full max-h-full w-full flex flex-col">
      <Card className="h-full flex flex-col overflow-hidden shadow-lg">
        <CardHeader className="pb-4 border-b">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Elysia - Your AI Palmistry Guide
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  title="Palm Photo Guide"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <PalmGuide />
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 flex flex-col p-0 overflow-hidden min-h-0">
          {/* Pre-built questions */}
          <div className="p-4 border-b bg-muted/20 flex-shrink-0">
            <div className="flex flex-wrap gap-2">
              {prebuiltQuestions.slice(0, 3).map((question, index) => {
                const icons = ['💍', '💰', '💕']; // Icons for each question
                return (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10 transition-colors text-sm px-3 py-2 bg-background/50 border-primary/30"
                    onClick={() => handleQuickResponse(question)}
                  >
                    <span className="mr-1">{icons[index]}</span>
                    {question}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Chat messages */}
          <ScrollArea className="flex-1 min-h-0 p-4" ref={scrollAreaRef}>
            <div className="space-y-4 pb-2">
              {messages.map((message, index) => {
                  // Check if we need to show a date separator
                  const showDateSeparator = index === 0 || 
                    message.timestamp.toDateString() !== messages[index - 1].timestamp.toDateString();
                  const isLastMessage = index === messages.length - 1;
                  
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
                        {message.sender === 'elysia' && (
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              <Sparkles className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                        )}
                        
                        <div
                          className={`group relative max-w-[85%] md:max-w-[80%] lg:max-w-[75%] rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
                            message.sender === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          {message.imageUrl && (
                            <img
                              src={message.imageUrl}
                              alt="Palm image"
                              className="w-full max-w-[200px] rounded-lg mb-2 transition-transform hover:scale-[1.02]"
                            />
                          )}
                          <div className={`text-sm ${message.isTyping ? 'italic animate-pulse' : ''}`}>
                            {message.content.split('\n').map((line, index) => {
                              // Handle headers (lines starting with ##)
                              if (line.startsWith('## ')) {
                                return (
                                  <h3 key={index} className="font-semibold text-base mt-3 mb-2 text-primary flex items-center gap-2">
                                    ✨ {line.replace('## ', '')}
                                  </h3>
                                );
                              }
                              
                              // Handle subheaders (lines starting with #)
                              if (line.startsWith('# ')) {
                                return (
                                  <h4 key={index} className="font-medium text-sm mt-2 mb-1 text-cosmic-purple flex items-center gap-1">
                                    🔮 {line.replace('# ', '')}
                                  </h4>
                                );
                              }
                              
                              // Handle bullet points
                              if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
                                return (
                                  <div key={index} className="ml-4 mb-1 flex items-start gap-2 hover:bg-muted/30 rounded p-1 transition-colors">
                                    <span className="text-cosmic-blue text-xs mt-1">💫</span>
                                    <span>{line.replace(/^[•\-]\s*/, '')}</span>
                                  </div>
                                );
                              }
                              
                              // Handle numbered lists
                              if (line.trim().match(/^\d+\.\s/)) {
                                return (
                                  <div key={index} className="ml-4 mb-1 flex items-start gap-2 hover:bg-muted/30 rounded p-1 transition-colors">
                                    <span className="text-cosmic-purple font-medium text-xs mt-1 bg-primary/10 rounded-full w-5 h-5 flex items-center justify-center">
                                      {line.match(/^\d+/)?.[0]}
                                    </span>
                                    <span>{line.replace(/^\d+\.\s*/, '')}</span>
                                  </div>
                                );
                              }
                              
                              // Handle bold text (**text**)
                              if (line.includes('**')) {
                                const parts = line.split(/(\*\*.*?\*\*)/g);
                                return (
                                  <p key={index} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
                                    {parts.map((part, partIndex) => {
                                      if (part.startsWith('**') && part.endsWith('**')) {
                                        return (
                                          <strong key={partIndex} className="font-semibold text-cosmic-purple bg-primary/5 px-1 rounded">
                                            {part.slice(2, -2)}
                                          </strong>
                                        );
                                      }
                                      return part;
                                    })}
                                  </p>
                                );
                              }
                              
                              // Regular paragraphs
                              if (line.trim() === '') {
                                return <div key={index} className="mb-2" />;
                              }
                              
                              return (
                                <p key={index} className="mb-1 leading-relaxed">
                                  {line}
                                </p>
                              );
                            })}
                          </div>
                          
                          {/* Follow-up Questions - Show only for the most recent elysia message */}
                          {message.sender === 'elysia' && 
                           !message.isTyping && 
                           message.followUpQuestions && 
                           message.followUpQuestions.length > 0 && 
                           index === messages.length - 1 && (
                            <div ref={followUpQuestionsRef} className="mt-4 space-y-2">
                              <div className="flex flex-wrap gap-2">
                                {message.followUpQuestions.map((question, qIndex) => (
                                  <Button
                                    key={qIndex}
                                    onClick={() => handleFollowUpQuestion(question)}
                                    variant="outline"
                                    size="sm"
                                    className="bg-background/50 border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50 text-sm px-4 py-2 h-auto rounded-full transition-all duration-200 hover:scale-105 whitespace-normal text-left max-w-full line-clamp-2"
                                  >
                                    {question}
                                  </Button>
                                ))}
                              </div>
                            </div>
                           )}
                          
                          
                          
                           {/* Interactive buttons for bot messages */}
                          {message.sender === 'elysia' && !message.isTyping && (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted-foreground/20">
                              <span className="text-xs opacity-70">
                                {message.timestamp.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-primary/10"
                                  onClick={() => copyToClipboard(message.content)}
                                  title="Copy response"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 hover:bg-green-100 dark:hover:bg-green-900/20"
                                  onClick={() => handleThumbsUp(message.id)}
                                  title="Helpful reading"
                                >
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {/* Timestamp for user messages */}
                          {message.sender === 'user' && (
                            <span className="text-xs opacity-70 mt-1 block">
                              {message.timestamp.toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </span>
                          )}
                        </div>
                        
                        {message.sender === 'user' && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Loading history indicator at bottom */}
                {isLoadingHistory && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading chat history...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

          {/* Fixed input area at bottom */}
          <div className="border-t bg-background p-4 space-y-4 flex-shrink-0">
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
                  placeholder="Ask me anything"
                  disabled={isLoading}
                  className="flex-1"
                />
                
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  ref={libraryInputRef}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  ref={cameraInputRef}
                  className="hidden"
                />
                
                {/* Upload options in a plus menu */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      disabled={isLoading}
                      title="Upload Image"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-3" side="top" align="end">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground mb-3">Upload Palm Image</div>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2"
                        onClick={() => {
                          cameraInputRef.current?.click();
                        }}
                        disabled={isLoading}
                      >
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">Take Photo</span>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 h-auto py-2"
                        onClick={() => {
                          libraryInputRef.current?.click();
                        }}
                        disabled={isLoading}
                      >
                        <Image className="h-4 w-4" />
                        <span className="text-sm">Choose from Gallery</span>
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
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

      {/* Camera Preview Modal */}
      <Dialog open={showCameraModal} onOpenChange={stopCamera}>
        <DialogContent className="max-w-md">
          <DialogTitle>Position Your Palm</DialogTitle>
          <DialogDescription>
            Hold your palm flat and steady within the frame, then capture when ready
          </DialogDescription>
          <div className="space-y-4">
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-4 border-2 border-white/50 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
              </div>
            </div>
            
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
              <Button onClick={captureImage} className="bg-primary hover:bg-primary/90">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};