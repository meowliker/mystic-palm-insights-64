import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserStats {
  totalReadings: number;
  daysStreak: number;
  accuracy: number;
  cosmicSync: number;
  loading: boolean;
}

export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats>({
    totalReadings: 0,
    daysStreak: 0,
    accuracy: 0,
    cosmicSync: 0,
    loading: true
  });
  const { user } = useAuth();

  const calculateUserStats = async () => {
    if (!user) {
      setStats(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get total readings count
      const { count: totalReadings } = await supabase
        .from('palm_scans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Get all scan dates to calculate streak
      const { data: scans } = await supabase
        .from('palm_scans')
        .select('scan_date')
        .eq('user_id', user.id)
        .order('scan_date', { ascending: false });

      // Calculate days streak
      const daysStreak = calculateDaysStreak(scans?.map(s => new Date(s.scan_date)) || []);

      // Get profile completeness for cosmic sync
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, birthdate, phone_number, profile_picture_url')
        .eq('id', user.id)
        .single();

      // Calculate cosmic sync based on profile completeness and app usage
      const profileCompleteness = calculateProfileCompleteness(profile);
      const usageScore = Math.min(totalReadings || 0, 10) * 10; // Max 100 points for readings
      const streakScore = Math.min(daysStreak, 30) * 2; // Max 60 points for streak
      const cosmicSync = Math.round((profileCompleteness + usageScore + streakScore) / 2.2);

      // Calculate accuracy based on readings frequency (more readings = higher accuracy)
      const accuracy = totalReadings ? Math.min(5 + (totalReadings || 0) * 0.5, 10) : 0;

      setStats({
        totalReadings: totalReadings || 0,
        daysStreak,
        accuracy: Math.round(accuracy * 10) / 10,
        cosmicSync: Math.min(cosmicSync, 100),
        loading: false
      });

    } catch (error) {
      console.error('Error calculating user stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const calculateDaysStreak = (scanDates: Date[]): number => {
    if (scanDates.length === 0) return 0;

    const today = new Date();
    const todayStr = today.toDateString();
    
    // Sort dates in descending order
    const sortedDates = scanDates
      .map(date => new Date(date.toDateString())) // Normalize to midnight
      .sort((a, b) => b.getTime() - a.getTime());

    // Remove duplicates (same day scans)
    const uniqueDates = sortedDates.filter((date, index) => 
      index === 0 || date.getTime() !== sortedDates[index - 1].getTime()
    );

    if (uniqueDates.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date(today);
    currentDate.setHours(0, 0, 0, 0);

    // Check if there's a scan today or yesterday to start counting
    const latestScan = uniqueDates[0];
    const daysDiff = Math.floor((currentDate.getTime() - latestScan.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff > 1) return 0; // No recent activity
    
    // Start counting from the most recent scan date
    if (daysDiff === 1) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Count consecutive days
    for (const scanDate of uniqueDates) {
      if (scanDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const calculateProfileCompleteness = (profile: any): number => {
    if (!profile) return 0;
    
    let completeness = 0;
    const fields = ['full_name', 'birthdate', 'phone_number', 'profile_picture_url'];
    
    fields.forEach(field => {
      if (profile[field]) completeness += 25;
    });
    
    return completeness;
  };

  useEffect(() => {
    calculateUserStats();

    // Set up real-time subscription for palm_scans updates
    if (user) {
      const channel = supabase
        .channel('user-stats-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'palm_scans',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            calculateUserStats();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
          },
          () => {
            calculateUserStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return { stats, refreshStats: calculateUserStats };
};