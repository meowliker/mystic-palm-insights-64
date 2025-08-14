import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

const ALL_QUESTIONS = [
  "When will I find my soulmate?",
  "What does my wealth line reveal?",
  "Will I have a long and healthy life?",
  "What career path should I pursue?",
  "How many children will I have?",
  "What challenges await me this year?",
  "What are my natural talents?",
  "When will I achieve success?",
  "What does my love line say about relationships?",
  "How can I improve my financial situation?",
  "What health issues should I be aware of?",
  "What creative abilities do I possess?"
];

export const useQuestionRotation = () => {
  const { user } = useAuth();
  const [seenQuestions, setSeenQuestions] = useState<number[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's seen questions from database
  const fetchSeenQuestions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('seen_questions')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching seen questions:', error);
        setSeenQuestions([]);
      } else {
        setSeenQuestions(data?.seen_questions || []);
      }
    } catch (error) {
      console.error('Error in fetchSeenQuestions:', error);
      setSeenQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Update seen questions in database
  const updateSeenQuestions = useCallback(async (newSeenQuestions: number[]) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ seen_questions: newSeenQuestions })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating seen questions:', error);
      } else {
        setSeenQuestions(newSeenQuestions);
      }
    } catch (error) {
      console.error('Error in updateSeenQuestions:', error);
    }
  }, [user]);

  // Get 3 random questions that haven't been seen recently
  const getRotatedQuestions = useCallback(() => {
    if (!user) {
      // If no user, just return 3 random questions
      const shuffled = [...ALL_QUESTIONS].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 3);
    }

    const totalQuestions = ALL_QUESTIONS.length;
    let availableIndices: number[] = [];

    // If user has seen less than half the questions, show only unseen ones
    if (seenQuestions.length < totalQuestions / 2) {
      availableIndices = Array.from({ length: totalQuestions }, (_, i) => i)
        .filter(index => !seenQuestions.includes(index));
    } else {
      // If user has seen most questions, reset and start over
      // but avoid the most recently seen ones (last 3)
      const recentlySeenIndices = seenQuestions.slice(-3);
      availableIndices = Array.from({ length: totalQuestions }, (_, i) => i)
        .filter(index => !recentlySeenIndices.includes(index));
      
      // If we're resetting, clear the seen questions except recent ones
      if (seenQuestions.length >= totalQuestions * 0.75) {
        updateSeenQuestions(recentlySeenIndices);
      }
    }

    // If somehow we have no available questions, use all questions
    if (availableIndices.length === 0) {
      availableIndices = Array.from({ length: totalQuestions }, (_, i) => i);
    }

    // Shuffle and select 3 questions
    const shuffledIndices = [...availableIndices].sort(() => 0.5 - Math.random());
    const selectedIndices = shuffledIndices.slice(0, Math.min(3, shuffledIndices.length));
    
    // Update seen questions
    const newSeenQuestions = [...seenQuestions, ...selectedIndices];
    updateSeenQuestions(newSeenQuestions);

    // Return the actual question strings
    return selectedIndices.map(index => ALL_QUESTIONS[index]);
  }, [seenQuestions, user, updateSeenQuestions]);

  // Initialize questions when component mounts or user changes
  useEffect(() => {
    if (!user) {
      setSelectedQuestions(getRotatedQuestions());
      setLoading(false);
      return;
    }

    fetchSeenQuestions();
  }, [user, fetchSeenQuestions]);

  // Set selected questions once we have seen questions data
  useEffect(() => {
    if (!loading && user) {
      setSelectedQuestions(getRotatedQuestions());
    }
  }, [loading, user, getRotatedQuestions]);

  return {
    selectedQuestions,
    loading,
    refreshQuestions: getRotatedQuestions
  };
};