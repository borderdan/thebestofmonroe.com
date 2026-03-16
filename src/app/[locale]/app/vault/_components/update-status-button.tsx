'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { updateSubmissionStatus } from '@/lib/actions/vault';
import { Check, Archive, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface UpdateStatusButtonProps {
  id: string;
  currentStatus: 'new' | 'read' | 'archived';
}

export function UpdateStatusButton({ id, currentStatus }: UpdateStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations('Vault');

  const handleUpdate = (newStatus: 'new' | 'read' | 'archived') => {
    startTransition(async () => {
      await updateSubmissionStatus(id, newStatus);
    });
  };

  if (currentStatus === 'archived') return null;

  return (
    <div className="flex items-center gap-2">
      {currentStatus === 'new' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUpdate('read')}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
          {t('markRead')}
        </Button>
      )}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleUpdate('archived')}
        disabled={isPending}
        className="text-muted-foreground hover:text-destructive"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
        {t('archive')}
      </Button>
    </div>
  );
}
