import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Label } from '../ui/label';
import { privacyService } from '../../services/privacy.service';

interface ThreadRetentionDialogProps {
  threadId: string;
  trigger: React.ReactNode;
}

const ThreadRetentionDialog: React.FC<ThreadRetentionDialogProps> = ({
  threadId,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState<string>('0');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await privacyService.setThreadRetention(threadId, parseInt(retentionPeriod));
      setOpen(false);
    } catch (error) {
      console.error('Failed to set thread retention:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Thread Retention Settings</DialogTitle>
          <DialogDescription>
            Set how long messages should be kept in this thread. Messages older
            than the retention period will be automatically deleted.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="retention">Retention Period</Label>
            <Select
              value={retentionPeriod}
              onValueChange={setRetentionPeriod}
            >
              <SelectTrigger id="retention">
                <SelectValue placeholder="Select retention period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Keep forever</SelectItem>
                <SelectItem value="86400">24 hours</SelectItem>
                <SelectItem value="604800">7 days</SelectItem>
                <SelectItem value="2592000">30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ThreadRetentionDialog;
