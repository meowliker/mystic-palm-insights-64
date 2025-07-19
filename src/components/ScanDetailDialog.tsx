import React from 'react';
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
  const { deleteScan } = useScans();
  const { toast } = useToast();

  const handleDelete = async () => {
    const success = await deleteScan(scan.id);
    if (success) {
      toast({
        title: "Reading deleted",
        description: "Your palm reading has been successfully deleted."
      });
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
    <Dialog>
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
          {/* Palm Images */}
          {(scan.palm_image_url || scan.right_palm_image_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Captured Palm Images
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center gap-4 flex-wrap">
                  {scan.palm_image_url && (
                    <div className="text-center">
                      <img
                        src={scan.palm_image_url}
                        alt="Left Palm"
                        className="max-w-sm max-h-64 object-contain rounded-lg border border-border/50"
                      />
                      <p className="text-sm text-muted-foreground mt-2">Left Palm</p>
                    </div>
                  )}
                  {scan.right_palm_image_url && (
                    <div className="text-center">
                      <img
                        src={scan.right_palm_image_url}
                        alt="Right Palm"
                        className="max-w-sm max-h-64 object-contain rounded-lg border border-border/50"
                      />
                      <p className="text-sm text-muted-foreground mt-2">Right Palm</p>
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
              <div className="text-foreground leading-relaxed whitespace-pre-line">
                {cleanupMarkdown(scan.overall_insight)}
              </div>
            </CardContent>
          </Card>

          {/* Palm Lines Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Life Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getLineStrengthColor(scan.life_line_strength)}>
                  {scan.life_line_strength}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Represents vitality, health, and general life journey. Your life line indicates {scan.life_line_strength?.toLowerCase()} life force and energy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-pink-500" />
                  Heart Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getLineStrengthColor(scan.heart_line_strength)}>
                  {scan.heart_line_strength}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Relates to emotions, relationships, and love life. Your heart line shows {scan.heart_line_strength?.toLowerCase()} emotional capacity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-blue-500" />
                  Head Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getLineStrengthColor(scan.head_line_strength)}>
                  {scan.head_line_strength}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Represents intellect, reasoning, and thought processes. Your head line suggests {scan.head_line_strength?.toLowerCase()} mental clarity.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-purple-500" />
                  Fate Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Badge className={getLineStrengthColor(scan.fate_line_strength)}>
                  {scan.fate_line_strength}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Indicates destiny, life's path, and external influences. Your fate line shows {scan.fate_line_strength?.toLowerCase()} destiny connection.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Character Traits */}
          {scan.traits && (
            <Card>
              <CardHeader>
                <CardTitle>Character Traits & Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(scan.traits).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-muted-foreground capitalize">
                        {key.replace('_', ' ')}:
                      </span>
                      <Badge variant="outline">{value as string}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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