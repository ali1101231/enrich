import { Newspaper, CalendarClock, UserRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNews } from '@/hooks/useApi';

export default function News() {
  const { data: news, isLoading } = useNews();
  const totalNews = news?.length ?? 0;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <Newspaper className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">News</h1>
        </div>
        <p className="text-muted-foreground">
          Stay up to date with platform announcements and important updates from the admin team.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{totalNews} update{totalNews === 1 ? '' : 's'}</Badge>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading news...</CardContent>
        </Card>
      ) : !news || news.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Newspaper className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No news available right now</p>
            <p className="text-sm text-muted-foreground mt-1">Please check back shortly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={news.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 2xl:grid-cols-2 gap-4'}>
          {news.map((item) => (
            <Card key={item.id}>
              <CardHeader className="space-y-3 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg leading-tight">{item.title}</CardTitle>
                  <Badge variant="outline">Live</Badge>
                </div>
                <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Updated {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <UserRound className="h-3.5 w-3.5" />
                    {item.createdBy?.displayName || 'Admin'}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm whitespace-pre-wrap leading-6">{item.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
