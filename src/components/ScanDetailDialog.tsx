import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, TrendingUp, Star, Eye, Trash2, Calendar, Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useScans } from '@/hooks/useScans';
import { RenameScanDialog } from '@/components/RenameScanDialog';
import { format } from 'date-fns';
import { cleanupMarkdown } from '@/utils/cleanupMarkdown';
import EnhancedPalmDisplay from '@/components/EnhancedPalmDisplay';

interface ScanDetailDialogProps {
  scan: any;
  children: React.ReactNode;
  onScanDeleted?: () => void;
}

const ScanDetailDialog = ({ scan, children, onScanDeleted }: ScanDetailDialogProps) => {
  const { deleteScan, updateScanName, fetchScans } = useScans();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    console.log('Deleting scan:', scan.id);
    
    try {
      const success = await deleteScan(scan.id);
      if (success) {
        console.log('Scan deleted successfully, forcing refresh...');
        // Force an immediate refresh of the scans
        await fetchScans();
        // Call the parent callback if provided
        if (onScanDeleted) {
          onScanDeleted();
        }
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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete reading. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
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
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-2 flex-1">
              <Star className="h-5 w-5 text-primary" />
              <DialogTitle className="flex items-center gap-2">
                {scan.reading_name || 'Palm Reading'}
                {scan.reading_name && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                    Custom
                  </Badge>
                )}
              </DialogTitle>
              <RenameScanDialog
                currentName={scan.reading_name || null}
                scanDate={scan.scan_date}
                onRename={async (newName) => {
                  await updateScanName(scan.id, newName);
                  toast({
                    title: "Reading renamed",
                    description: "Your palm reading has been renamed successfully.",
                  });
                }}
              >
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <Pencil className="h-3 w-3" />
                </Button>
              </RenameScanDialog>
            </div>
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
          {/* Palm Images */}
          {(scan.palm_image_url || scan.right_palm_image_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Captured Palm Image{(scan.palm_image_url && scan.right_palm_image_url) ? 's' : ''}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap justify-center gap-6">
                  {scan.palm_image_url && (
                    <div className="text-center">
                      <img
                        src={scan.palm_image_url}
                        alt="Left Palm"
                        className="max-w-xs sm:max-w-sm rounded-lg border-2 border-primary/20 shadow-lg"
                      />
                      <Badge className="mt-2" variant="secondary">Left Palm</Badge>
                    </div>
                  )}
                  {scan.right_palm_image_url && (
                    <div className="text-center">
                      <img
                        src={scan.right_palm_image_url}
                        alt="Right Palm"
                        className="max-w-xs sm:max-w-sm rounded-lg border-2 border-primary/20 shadow-lg"
                      />
                      <Badge className="mt-2" variant="secondary">Right Palm</Badge>
                    </div>
                  )}
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
              <div className="text-foreground leading-relaxed whitespace-pre-line text-center">
                {cleanupMarkdown(scan.overall_insight)}
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Palm Analysis - Show detailed analysis if available */}
          <EnhancedPalmDisplay palmData={scan} />

          {/* Delete Button */}
          <div className="flex justify-center pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isDeleting ? "Deleting..." : "Delete This Reading"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScanDetailDialog;