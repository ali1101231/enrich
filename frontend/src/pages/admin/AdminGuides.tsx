import { useState } from 'react';
import {
  Plus,
  BookOpen,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Video,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminGuides,
  useAdminCreateGuide,
  useAdminUpdateGuide,
  useAdminDeleteGuide,
} from '@/hooks/useApi';
import type { AdminGuideItem } from '@/lib/api';
import { getYouTubeEmbedUrl, isValidYouTubeUrl } from '@/lib/youtube';

interface GuideFormState {
  title: string;
  content: string;
  videoUrl: string;
  isActive: boolean;
}

const emptyForm: GuideFormState = {
  title: '',
  content: '',
  videoUrl: '',
  isActive: true,
};

export default function AdminGuides() {
  const { toast } = useToast();
  const { data: guides, isLoading } = useAdminGuides();
  const createMutation = useAdminCreateGuide();
  const updateMutation = useAdminUpdateGuide();
  const deleteMutation = useAdminDeleteGuide();

  const [createOpen, setCreateOpen] = useState(false);
  const [editGuide, setEditGuide] = useState<AdminGuideItem | null>(null);
  const [deleteGuide, setDeleteGuide] = useState<AdminGuideItem | null>(null);

  const [createForm, setCreateForm] = useState<GuideFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<GuideFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseGuideForm = (form: GuideFormState) => {
    if (!form.title.trim()) {
      throw new Error('Title is required.');
    }
    if (!form.content.trim()) {
      throw new Error('Guide content is required.');
    }

    const trimmedVideoUrl = form.videoUrl.trim();
    if (trimmedVideoUrl && !isValidYouTubeUrl(trimmedVideoUrl)) {
      throw new Error('Please provide a valid YouTube URL.');
    }

    return {
      title: form.title.trim(),
      content: form.content.trim(),
      videoUrl: trimmedVideoUrl || undefined,
      isActive: form.isActive,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseGuideForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'Guide uploaded' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to upload guide';
      toast({ title: 'Upload failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (guide: AdminGuideItem) => {
    setEditGuide(guide);
    setEditForm({
      title: guide.title,
      content: guide.content,
      videoUrl: guide.videoUrl ?? '',
      isActive: guide.isActive,
    });
  };

  const handleEdit = async () => {
    if (!editGuide) return;

    try {
      const data = parseGuideForm(editForm);
      await updateMutation.mutateAsync({
        guideId: editGuide.id,
        data: {
          ...data,
          videoUrl: editForm.videoUrl.trim() ? data.videoUrl : null,
        },
      });
      toast({ title: 'Guide updated' });
      setEditGuide(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update guide';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteGuide) return;

    try {
      await deleteMutation.mutateAsync(deleteGuide.id);
      toast({ title: 'Guide deleted' });
      setDeleteGuide(null);
    } catch {
      toast({ title: 'Failed to delete guide', variant: 'destructive' });
    }
  };

  const totalGuides = guides?.length ?? 0;
  const activeGuides = guides?.filter((guide) => guide.isActive).length ?? 0;
  const guidesWithVideo = guides?.filter((guide) => !!guide.videoUrl).length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guides</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Upload guide content for users. Active guides appear instantly on the user Guide page.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Upload Guide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Guide</DialogTitle>
              <DialogDescription>
                Add a new guide for users. They will see it on their Guide page if active.
              </DialogDescription>
            </DialogHeader>
            <GuideFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Uploading...' : 'Upload Guide'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Guides</p>
                <p className="text-2xl font-bold">{totalGuides}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Power className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Guides</p>
                <p className="text-2xl font-bold">{activeGuides}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Video className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">With Video</p>
                <p className="text-2xl font-bold">{guidesWithVideo}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guide</TableHead>
                <TableHead className="text-center">Video</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading guides...
                  </TableCell>
                </TableRow>
              ) : !guides || guides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No guides yet. Click "Upload Guide" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                guides.map((guide) => (
                  <TableRow key={guide.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{guide.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[420px] whitespace-pre-wrap">
                          {guide.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {guide.videoUrl ? (
                        <Badge variant="outline" className="gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          YouTube
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={guide.isActive ? 'default' : 'secondary'}
                        className={cn(
                          guide.isActive && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
                          !guide.isActive && 'bg-gray-500/10 text-gray-500'
                        )}
                      >
                        {guide.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {guide.createdBy?.displayName || guide.createdBy?.email || 'Admin'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(guide.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(guide)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteGuide(guide)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!editGuide} onOpenChange={(open) => { if (!open) setEditGuide(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Guide</DialogTitle>
            <DialogDescription>
              Update the guide details. Active guides are visible to users immediately.
            </DialogDescription>
          </DialogHeader>
          <GuideFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditGuide(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteGuide} onOpenChange={(open) => { if (!open) setDeleteGuide(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Guide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteGuide?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GuideFormFields({
  form,
  setForm,
}: {
  form: GuideFormState;
  setForm: React.Dispatch<React.SetStateAction<GuideFormState>>;
}) {
  const trimmedVideoUrl = form.videoUrl.trim();
  const embedUrl = trimmedVideoUrl ? getYouTubeEmbedUrl(trimmedVideoUrl) : null;
  const hasInvalidVideoUrl = trimmedVideoUrl.length > 0 && !isValidYouTubeUrl(trimmedVideoUrl);

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Guide Title</Label>
        <Input
          placeholder="e.g. How to use Email Enricher"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Guide Content</Label>
        <Textarea
          placeholder="Write full guide steps for users..."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={10}
        />
      </div>

      <div className="space-y-2">
        <Label>YouTube Video URL (Optional)</Label>
        <Input
          placeholder="https://www.youtube.com/watch?v=..."
          value={form.videoUrl}
          onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
        />
        <p className={cn('text-xs', hasInvalidVideoUrl ? 'text-destructive' : 'text-muted-foreground')}>
          {hasInvalidVideoUrl
            ? 'Please enter a valid YouTube URL (youtube.com or youtu.be).'
            : 'Admins can attach a YouTube video to this guide.'}
        </p>
      </div>

      {embedUrl && (
        <div className="overflow-hidden rounded-lg border border-border bg-background">
          <iframe
            className="w-full aspect-video"
            src={embedUrl}
            title="Guide video preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Switch
          checked={form.isActive}
          onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
        />
        <Label>Active</Label>
      </div>
    </div>
  );
}
