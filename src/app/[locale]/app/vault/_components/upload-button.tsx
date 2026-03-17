'use client';

import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { createSubmission } from '@/lib/actions/vault';

export function UploadButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formId, setFormId] = useState('');
  const [payloadStr, setPayloadStr] = useState('{\n  "key": "value"\n}');

  const handleUpload = async () => {
    let payload = {};
    try {
      payload = JSON.parse(payloadStr);
    } catch (e) {
      toast.error('Invalid JSON payload');
      return;
    }

    if (!formId.trim()) {
      toast.error('Form ID is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await createSubmission(formId.trim(), payload);
      if (res.success) {
        toast.success('Upload successful');
        setOpen(false);
        setFormId('');
        setPayloadStr('{\n  "key": "value"\n}');
      } else {
        toast.error(res.error || 'Upload failed');
      }
    } catch (e: any) {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ variant: "default" })}>
        <Upload className="h-4 w-4 mr-2" />
        {label}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Submission</DialogTitle>
          <DialogDescription>
            Manually upload a new vault submission with JSON data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="formId">Form ID</Label>
            <Input
              id="formId"
              value={formId}
              onChange={(e) => setFormId(e.target.value)}
              placeholder="custom_form_1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="payload">JSON Payload</Label>
            <Textarea
              id="payload"
              value={payloadStr}
              onChange={(e) => setPayloadStr(e.target.value)}
              className="font-mono text-xs h-32"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
