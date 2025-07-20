import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, TrendingUp, Star, Eye, Trash2, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScans } from '@/hooks/useScans';
import { format } from 'date-fns';
import { cleanupMarkdown } from '@/utils/cleanupMarkdown';

interface ScanDetailDialogProps {
  scan: any;
  children: React.ReactNode;
}

const ScanDetailDialog = ({ scan, children }: ScanDetailDialogProps) => {
  const { deleteScan, fetchScans } = useScans();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    console.log('Deleting scan:', scan.id);
    const success = await deleteScan(scan.id);
    if (success) {
      console.log('Scan deleted successfully, forcing refresh...');
      // Force an immediate refresh of the scans
      await fetchScans();
      toast({
        title: "Reading deleted",
        description: "Your palm reading has been successfully deleted."
      });
      setOpen(false); // Close the dialog
    } else {
      toast({
        title: "Error",
        description: "Failed to delete reading. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getLineStrengthColor = (strength: string) => {
    switch (strength?.toLowerCase()) {
      case 'strong': case 'deep': case 'prominent': case 'clear':
        return 'bg-green-500/20 text-green-700 dark:text-green-300';
      case 'moderate': case 'average':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300';
      case 'weak': case 'faint': case 'shallow':
        return 'bg-red-500/20 text-red-700 dark:text-red-300';
      default:
        return 'bg-primary/20 text-primary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Palm Reading Details
            </DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(new Date(scan.created_at), 'PPP')}
            </div>
          </div>
          <DialogDescription className="sr-only">
            Detailed palm reading analysis with insights and interpretations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Palm Image */}
          {scan.palm_image_url && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Captured Palm Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="text-center">
                    <img
                      src={scan.palm_image_url}
                      alt="Palm"
                      className="max-w-sm max-h-64 object-contain rounded-lg border border-border/50"
                    />
                    <p className="text-sm text-muted-foreground mt-2">Your Palm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overall Insight */}
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Cosmic Insight
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-foreground leading-relaxed whitespace-pre-line">
                {cleanupMarkdown(scan.overall_insight)}
              </div>
            </CardContent>
          </Card>

          {/* Removed individual palm line cards and character traits - all details are in the main reading */}

          {/* Delete Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete This Reading
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanDetailDialog;