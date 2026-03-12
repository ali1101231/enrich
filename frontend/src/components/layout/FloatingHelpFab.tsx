import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FloatingHelpFab() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-7 right-5 z-40 flex flex-col items-end gap-2">
      <div
        className={cn(
          'flex flex-col items-end gap-2 transition-all duration-200',
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
        )}
      >
        <Button asChild variant="secondary" size="icon" className="h-11 w-11 rounded-2xl border border-border/75 bg-card/92 shadow-[0_14px_26px_-20px_hsl(var(--foreground)/0.8)]">
          <Link to="/guide" aria-label="Open guide" onClick={() => setOpen(false)}>
            <BookOpen className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary" size="icon" className="h-11 w-11 rounded-2xl border border-border/75 bg-card/92 shadow-[0_14px_26px_-20px_hsl(var(--foreground)/0.8)]">
          <Link to="/support" aria-label="Open support" onClick={() => setOpen(false)}>
            <LifeBuoy className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <Button
        type="button"
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close help menu' : 'Open help menu'}
        className={cn(
          'h-14 w-14 rounded-3xl gradient-koldify text-white shadow-glow hover:opacity-95',
          !open && 'animate-bounce [animation-duration:2.6s] [animation-timing-function:ease-in-out]'
        )}
      >
        <span className="text-2xl font-bold leading-none">?</span>
      </Button>
    </div>
  );
}