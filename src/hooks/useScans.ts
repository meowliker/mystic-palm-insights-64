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
  palm_image_url?: string;
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
    palm_image_url?: string;
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

  const deleteScan = async (scanId: string) => {
    if (!user) return false;

    try {
      // First get the scan to find the image URL
      const { data: scan } = await supabase
        .from('palm_scans')
        .select('palm_image_url')
        .eq('id', scanId)
        .eq('user_id', user.id)
        .single();

      // Delete the scan record
      const { error } = await supabase
        .from('palm_scans')
        .delete()
        .eq('id', scanId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting scan:', error);
        return false;
      }

      // Delete the associated image if it exists
      if (scan?.palm_image_url) {
        try {
          const fileName = scan.palm_image_url.split('/').pop();
          if (fileName) {
            await supabase.storage
              .from('palm-images')
              .remove([`${user.id}/${fileName}`]);
          }
        } catch (imageError) {
          console.error('Error deleting image:', imageError);
          // Don't fail the whole operation if image deletion fails
        }
      }

      // Refresh scans after deletion
      fetchScans();
      return true;
    } catch (error) {
      console.error('Error deleting scan:', error);
      return false;
    }
  };

  const clearAllScans = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Get file paths before deleting database records
      const { data: scansWithImages } = await supabase
        .from('palm_scans')
        .select('palm_image_url')
        .eq('user_id', user.id)
        .not('palm_image_url', 'is', null);

      // Prepare file paths for batch deletion
      const filePaths = scansWithImages
        ?.map(scan => {
          if (scan.palm_image_url) {
            const fileName = scan.palm_image_url.split('/').pop();
            return fileName ? `${user.id}/${fileName}` : null;
          }
          return null;
        })
        .filter(Boolean) as string[] || [];

      // Delete database records and storage files in parallel
      const [deleteResult] = await Promise.allSettled([
        supabase.from('palm_scans').delete().eq('user_id', user.id),
        filePaths.length > 0 ? supabase.storage.from('palm-images').remove(filePaths) : Promise.resolve()
      ]);

      if (deleteResult.status === 'rejected' || deleteResult.value.error) {
        console.error('Error clearing all scans:', deleteResult);
        return false;
      }

      // Refresh the scans list
      await fetchScans();
      return true;
    } catch (error) {
      console.error('Error clearing all scans:', error);
      return false;
    }
  };

  const hasScans = scans.length > 0;

  useEffect(() => {
    fetchScans();
  }, [user]);

  return {
    scans,
    loading,
    saveScan,
    deleteScan,
    clearAllScans,
    hasScans,
    fetchScans
  };
};