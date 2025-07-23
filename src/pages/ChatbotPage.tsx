import React from 'react';
import { Chatbot } from '@/components/Chatbot';

const ChatbotPage: React.FC = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 flex flex-col overflow-hidden">
      <div className="container mx-auto h-full flex flex-col p-4">
        <div className="text-center mb-4 flex-shrink-0">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-blue bg-clip-text text-transparent mb-2">
            Astrobot
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Your AI palmistry guide ready to unlock the secrets hidden in your palms.
          </p>
        </div>
        
        <div className="flex-1 min-h-0">
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;