import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface ScanData {
  id: string;
  user_id: string;
  scan_date: string;
  reading_name?: string;
  life_line_strength: string;
  heart_line_strength: string;
  head_line_strength: string;
  fate_line_strength: string;
  overall_insight: string;
  traits: any;
  palm_image_url?: string;
  right_palm_image_url?: string;
  // Enhanced palmistry fields
  age_predictions?: any;
  wealth_analysis?: any;
  mount_analysis?: any;
  line_intersections?: any;
  age_timeline?: any;
  partnership_predictions?: any;
  created_at: string;
  updated_at: string;
}

export const useScans = () => {
  const [scans, setScans] = useState<ScanData[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchScans = async () => {
    console.log('=== FETCHING SCANS ===');
    console.log('User:', user?.id);
    
    if (!user) {
      console.log('No user, setting empty scans');
      setScans([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching scans from database for user:', user.id);
      
      const { data, error } = await supabase
        .from('palm_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching scans:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return;
      }

      console.log('Fetched scans from database:', data);
      console.log('Number of scans found:', data?.length || 0);
      
      setScans(data || []);
    } catch (error) {
      console.error('Exception while fetching scans:', error);
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
    right_palm_image_url?: string;
    // Enhanced palmistry fields
    age_predictions?: any;
    wealth_analysis?: any;
    mount_analysis?: any;
    line_intersections?: any;
    age_timeline?: any;
    partnership_predictions?: any;
  }) => {
    if (!user) {
      console.error('Cannot save scan: user not authenticated');
      return null;
    }

    try {
      console.log('=== SAVING SCAN TO DATABASE ===');
      console.log('User ID:', user.id);
      console.log('Scan data to save:', scanData);
      
      const dataToInsert = {
        user_id: user.id,
        life_line_strength: scanData.life_line_strength,
        heart_line_strength: scanData.heart_line_strength,
        head_line_strength: scanData.head_line_strength,
        fate_line_strength: scanData.fate_line_strength,
        overall_insight: scanData.overall_insight,
        traits: scanData.traits,
        palm_image_url: scanData.palm_image_url || null,
        right_palm_image_url: scanData.right_palm_image_url || null,
        // Enhanced palmistry fields
        age_predictions: scanData.age_predictions || null,
        wealth_analysis: scanData.wealth_analysis || null,
        mount_analysis: scanData.mount_analysis || null,
        line_intersections: scanData.line_intersections || null,
        age_timeline: scanData.age_timeline || null,
        partnership_predictions: scanData.partnership_predictions || null
      };
      
      console.log('Final data for database insert:', dataToInsert);
      
      const { data, error } = await supabase
        .from('palm_scans')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        return null;
      }

      console.log('Scan saved successfully to database:', data);
      
      // Force refresh scans after saving
      console.log('Refreshing scans list...');
      await fetchScans();
      console.log('Scans list refreshed');
      
      return data;
    } catch (error) {
      console.error('Exception while saving scan:', error);
      return null;
    }
  };

  const updateScanName = async (scanId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('palm_scans')
        .update({ reading_name: newName.trim() || null })
        .eq('id', scanId);

      if (error) throw error;

      await fetchScans();
    } catch (error) {
      console.error('Error updating scan name:', error);
      throw error;
    }
  };

  const deleteScan = async (scanId: string) => {
    if (!user) {
      console.error('Cannot delete scan: user not authenticated');
      return false;
    }

    try {
      console.log('Deleting scan:', scanId);
      
      // First, get the scan to delete associated images
      const { data: scan } = await supabase
        .from('palm_scans')
        .select('palm_image_url, right_palm_image_url')
        .eq('id', scanId)
        .single();

      if (scan) {
        // Delete associated images from storage
        const imagesToDelete = [];
        if (scan.palm_image_url) {
          const palmImagePath = scan.palm_image_url.split('/').pop();
          if (palmImagePath) {
            imagesToDelete.push(palmImagePath);
          }
        }
        if (scan.right_palm_image_url) {
          const rightPalmImagePath = scan.right_palm_image_url.split('/').pop();
          if (rightPalmImagePath) {
            imagesToDelete.push(rightPalmImagePath);
          }
        }

        if (imagesToDelete.length > 0) {
          console.log('Deleting associated images:', imagesToDelete);
          await supabase.storage
            .from('palm-images')
            .remove(imagesToDelete);
        }
      }

      // Delete the scan record
      const { error } = await supabase
        .from('palm_scans')
        .delete()
        .eq('id', scanId);

      if (error) {
        console.error('Error deleting scan:', error);
        return false;
      }

      console.log('Scan deleted successfully');
      await fetchScans();
      return true;
    } catch (error) {
      console.error('Exception while deleting scan:', error);
      return false;
    }
  };

  const clearAllScans = async () => {
    if (!user) {
      console.error('Cannot clear scans: user not authenticated');
      return false;
    }

    try {
      // First, get all scans to delete associated images
      const { data: scans } = await supabase
        .from('palm_scans')
        .select('palm_image_url, right_palm_image_url')
        .eq('user_id', user.id);

      if (scans && scans.length > 0) {
        // Collect all image paths
        const imagesToDelete: string[] = [];
        scans.forEach(scan => {
          if (scan.palm_image_url) {
            const palmImagePath = scan.palm_image_url.split('/').pop();
            if (palmImagePath) {
              imagesToDelete.push(palmImagePath);
            }
          }
          if (scan.right_palm_image_url) {
            const rightPalmImagePath = scan.right_palm_image_url.split('/').pop();
            if (rightPalmImagePath) {
              imagesToDelete.push(rightPalmImagePath);
            }
          }
        });

        // Delete all images from storage
        if (imagesToDelete.length > 0) {
          console.log('Deleting all associated images:', imagesToDelete);
          await supabase.storage
            .from('palm-images')
            .remove(imagesToDelete);
        }
      }

      // Delete all scan records
      const { error } = await supabase
        .from('palm_scans')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing scans:', error);
        return false;
      }

      await fetchScans();
      return true;
    } catch (error) {
      console.error('Exception while clearing scans:', error);
      return false;
    }
  };

  const hasScans = scans.length > 0;

  useEffect(() => {
    fetchScans();
  }, [user]);

  // Listen for real-time changes to palm_scans table
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('palm-scans-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'palm_scans',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          console.log('Real-time change detected in palm_scans, refreshing...');
          fetchScans();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    scans,
    loading,
    saveScan,
    updateScanName,
    deleteScan,
    clearAllScans,
    hasScans,
    fetchScans
  };
};