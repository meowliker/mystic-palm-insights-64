import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScanData {
  id: string;
  user_id: string;
  scan_date: string;
  life_line_strength: string;
  heart_line_strength: string;
  head_line_strength: string;
  fate_line_strength: string;
  overall_insight: string;
  traits: any;
  created_at: string;
  updated_at: string;
}

export const useScans = () => {
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchScans = async () => {
    if (!user) {
      setScans([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('palm_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scans:', error);
        return;
      }

      setScans(data || []);
    } catch (error) {
      console.error('Error fetching scans:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveScan = async (scanData: {
    life_line_strength: string;
    heart_line_strength: string;
    head_line_strength: string;
    fate_line_strength: string;
    overall_insight: string;
    traits: any;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('palm_scans')
        .insert({
          user_id: user.id,
          ...scanData
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving scan:', error);
        return null;
      }

      // Refresh scans after saving
      fetchScans();
      return data;
    } catch (error) {
      console.error('Error saving scan:', error);
      return null;
    }
  };

  const hasScans = () => scans.length > 0;

  useEffect(() => {
    fetchScans();
  }, [user]);

  return {
    scans,
    loading,
    saveScan,
    hasScans,
    fetchScans
  };
};