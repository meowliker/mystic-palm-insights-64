import React from 'react';
import { Chatbot } from '@/components/Chatbot';

const ChatbotPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-blue bg-clip-text text-transparent mb-4">
            Astrobot
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your AI palmistry guide ready to unlock the secrets hidden in your palms. 
            Ask questions, upload images, and discover what your lines reveal about your destiny.
          </p>
        </div>
        
        <Chatbot />
      </div>
    </div>
  );
};

export default ChatbotPage;