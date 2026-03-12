import { useState } from 'react';
import {
  Plus,
  Newspaper,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
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
  useAdminNews,
  useAdminCreateNews,
  useAdminUpdateNews,
  useAdminDeleteNews,
} from '@/hooks/useApi';
import type { AdminNewsItem } from '@/lib/api';

interface NewsFormState {
  title: string;
  content: string;
  isActive: boolean;
}

const emptyForm: NewsFormState = {
  title: '',
  content: '',
  isActive: true,
};

export default function AdminNews() {
  const { toast } = useToast();
  const { data: news, isLoading } = useAdminNews();
  const createMutation = useAdminCreateNews();
  const updateMutation = useAdminUpdateNews();
  const deleteMutation = useAdminDeleteNews();

  const [createOpen, setCreateOpen] = useState(false);
  const [editNews, setEditNews] = useState<AdminNewsItem | null>(null);
  const [deleteNews, setDeleteNews] = useState<AdminNewsItem | null>(null);

  const [createForm, setCreateForm] = useState<NewsFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<NewsFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseNewsForm = (form: NewsFormState) => {
    if (!form.title.trim()) {
      throw new Error('Title is required.');
    }
    if (!form.content.trim()) {
      throw new Error('News content is required.');
    }

    return {
      title: form.title.trim(),
      content: form.content.trim(),
      isActive: form.isActive,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseNewsForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'News created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to create news';
      toast({ title: 'Create failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (item: AdminNewsItem) => {
    setEditNews(item);
    setEditForm({
      title: item.title,
      content: item.content,
      isActive: item.isActive,
    });
  };

  const handleEdit = async () => {
    if (!editNews) return;

    try {
      const data = parseNewsForm(editForm);
      await updateMutation.mutateAsync({
        newsId: editNews.id,
        data,
      });
      toast({ title: 'News updated' });
      setEditNews(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update news';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteNews) return;

    try {
      await deleteMutation.mutateAsync(deleteNews.id);
      toast({ title: 'News deleted' });
      setDeleteNews(null);
    } catch {
      toast({ title: 'Failed to delete news', variant: 'destructive' });
    }
  };

  const totalNews = news?.length ?? 0;
  const activeNews = news?.filter((item) => item.isActive).length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">News</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage announcements visible to users on the News page.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create News
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create News</DialogTitle>
              <DialogDescription>
                Add a new news update. Active items appear immediately for users.
              </DialogDescription>
            </DialogHeader>
            <NewsFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create News'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Newspaper className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total News</p>
                <p className="text-2xl font-bold">{totalNews}</p>
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
                <p className="text-sm text-muted-foreground">Active News</p>
                <p className="text-2xl font-bold">{activeNews}</p>
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
                <TableHead>News</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Loading news...
                  </TableCell>
                </TableRow>
              ) : !news || news.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No news yet. Click "Create News" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[460px] whitespace-pre-wrap">
                          {item.content}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={item.isActive ? 'default' : 'secondary'}
                        className={cn(
                          item.isActive && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
                          !item.isActive && 'bg-gray-500/10 text-gray-500'
                        )}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.createdBy?.displayName || item.createdBy?.email || 'Admin'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteNews(item)}
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

      <Dialog open={!!editNews} onOpenChange={(open) => { if (!open) setEditNews(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit News</DialogTitle>
            <DialogDescription>
              Update this news item. Active items are visible to users immediately.
            </DialogDescription>
          </DialogHeader>
          <NewsFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditNews(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteNews} onOpenChange={(open) => { if (!open) setDeleteNews(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete News</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteNews?.title}</strong>? This action cannot be undone.
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

function NewsFormFields({
  form,
  setForm,
}: {
  form: NewsFormState;
  setForm: React.Dispatch<React.SetStateAction<NewsFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>News Title</Label>
        <Input
          placeholder="e.g. New feature released"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>News Content</Label>
        <Textarea
          placeholder="Write your announcement for users..."
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          rows={10}
        />
      </div>

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
