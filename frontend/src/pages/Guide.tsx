import { BookOpen, CalendarClock, UserRound, Video } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGuides } from '@/hooks/useApi';
import { getYouTubeEmbedUrl } from '@/lib/youtube';

export default function Guide() {
  const { data: guides, isLoading } = useGuides();
  const totalGuides = guides?.length ?? 0;
  const guidesWithVideo = guides?.filter((guide) => !!guide.videoUrl).length ?? 0;

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Guide</h1>
        </div>
        <p className="text-muted-foreground">
          Learn how to use the platform with live guides published by the admin team.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{totalGuides} guide{totalGuides === 1 ? '' : 's'}</Badge>
          <Badge variant="outline" className="gap-1.5">
            <Video className="h-3.5 w-3.5" />
            {guidesWithVideo} with video
          </Badge>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading guides...</CardContent>
        </Card>
      ) : !guides || guides.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No guides available right now</p>
            <p className="text-sm text-muted-foreground mt-1">Please check back shortly.</p>
          </CardContent>
        </Card>
      ) : (
        <div className={guides.length === 1 ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-1 2xl:grid-cols-2 gap-4'}>
          {guides.map((guide) => {
            const embedUrl = getYouTubeEmbedUrl(guide.videoUrl);

            return (
              <Card key={guide.id} className="overflow-hidden">
                <CardHeader className="space-y-3 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg leading-tight">{guide.title}</CardTitle>
                    <Badge variant="outline">Live</Badge>
                  </div>
                  <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarClock className="h-3.5 w-3.5" />
                      Updated {formatDistanceToNow(new Date(guide.updatedAt), { addSuffix: true })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <UserRound className="h-3.5 w-3.5" />
                      {guide.createdBy?.displayName || guide.createdBy?.email || 'Admin'}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm whitespace-pre-wrap leading-6">{guide.content}</p>

                  {embedUrl && (
                    <div className="overflow-hidden rounded-lg border border-border bg-background">
                      <iframe
                        className="w-full aspect-video"
                        src={embedUrl}
                        title={`${guide.title} video`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
