import React from 'react';
import { Chatbot } from '@/components/Chatbot';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-cosmic-purple/20 to-cosmic-blue/20 flex flex-col overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-border/20">
        <div className="flex items-center justify-between w-full px-4">
          <Button 
            variant="ghost" 
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cosmic-purple to-cosmic-blue bg-clip-text text-transparent">
            Astrobot
          </h1>
          
          <div className="w-32" /> {/* Spacer for centering */}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 p-4">
        <div className="w-full h-full">
          <Chatbot />
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;