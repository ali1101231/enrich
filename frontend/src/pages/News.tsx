import { Newspaper } from 'lucide-react';

export default function News() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Newspaper className="h-16 w-16 text-muted-foreground/40 mb-6" />
      <h1 className="text-2xl font-bold mb-2">News</h1>
      <p className="text-muted-foreground text-lg">Coming soon</p>
    </div>
  );
}
