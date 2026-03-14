import { useState } from 'react';
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Star,
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
  useAdminWebsiteTestimonials,
  useAdminCreateWebsiteTestimonial,
  useAdminUpdateWebsiteTestimonial,
  useAdminDeleteWebsiteTestimonial,
} from '@/hooks/useApi';
import type { AdminWebsiteTestimonialItem } from '@/lib/api';

interface TestimonialFormState {
  clientName: string;
  clientRole: string;
  companyName: string;
  quote: string;
  avatarUrl: string;
  rating: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: TestimonialFormState = {
  clientName: '',
  clientRole: '',
  companyName: '',
  quote: '',
  avatarUrl: '',
  rating: '',
  isActive: true,
  sortOrder: '0',
};

export default function AdminWebsiteTestimonials() {
  const { toast } = useToast();
  const { data: testimonials, isLoading } = useAdminWebsiteTestimonials();
  const createMutation = useAdminCreateWebsiteTestimonial();
  const updateMutation = useAdminUpdateWebsiteTestimonial();
  const deleteMutation = useAdminDeleteWebsiteTestimonial();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminWebsiteTestimonialItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminWebsiteTestimonialItem | null>(null);

  const [createForm, setCreateForm] = useState<TestimonialFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<TestimonialFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseForm = (form: TestimonialFormState) => {
    if (!form.clientName.trim()) {
      throw new Error('Client name is required.');
    }
    if (!form.quote.trim()) {
      throw new Error('Quote is required.');
    }

    const sortOrder = parseInt(form.sortOrder, 10);
    if (isNaN(sortOrder) || sortOrder < 0) {
      throw new Error('Sort order must be a non-negative integer.');
    }

    const ratingText = form.rating.trim();
    const rating = ratingText ? parseInt(ratingText, 10) : null;
    if (ratingText && (isNaN(rating as number) || (rating as number) < 1 || (rating as number) > 5)) {
      throw new Error('Rating must be between 1 and 5.');
    }

    return {
      clientName: form.clientName.trim(),
      clientRole: form.clientRole.trim() || null,
      companyName: form.companyName.trim() || null,
      quote: form.quote.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      rating,
      isActive: form.isActive,
      sortOrder,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'Testimonial created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to create testimonial';
      toast({ title: 'Create failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (item: AdminWebsiteTestimonialItem) => {
    setEditItem(item);
    setEditForm({
      clientName: item.clientName,
      clientRole: item.clientRole ?? '',
      companyName: item.companyName ?? '',
      quote: item.quote,
      avatarUrl: item.avatarUrl ?? '',
      rating: item.rating == null ? '' : String(item.rating),
      isActive: item.isActive,
      sortOrder: String(item.sortOrder),
    });
  };

  const handleEdit = async () => {
    if (!editItem) return;

    try {
      const data = parseForm(editForm);
      await updateMutation.mutateAsync({
        testimonialId: editItem.id,
        data,
      });
      toast({ title: 'Testimonial updated' });
      setEditItem(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update testimonial';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast({ title: 'Testimonial deleted' });
      setDeleteItem(null);
    } catch {
      toast({ title: 'Failed to delete testimonial', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (item: AdminWebsiteTestimonialItem) => {
    try {
      await updateMutation.mutateAsync({
        testimonialId: item.id,
        data: { isActive: !item.isActive },
      });
      toast({ title: item.isActive ? 'Testimonial deactivated' : 'Testimonial activated' });
    } catch {
      toast({ title: 'Failed to update testimonial', variant: 'destructive' });
    }
  };

  const totalItems = testimonials?.length ?? 0;
  const activeItems = testimonials?.filter((item) => item.isActive).length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Testimonials</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage testimonials shown on the website.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Testimonial
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Testimonial</DialogTitle>
              <DialogDescription>
                Add a new testimonial with optional metadata, rating, visibility and sort order.
              </DialogDescription>
            </DialogHeader>
            <TestimonialFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Testimonial'}
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
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Testimonials</p>
                <p className="text-2xl font-bold">{totalItems}</p>
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
                <p className="text-sm text-muted-foreground">Active Testimonials</p>
                <p className="text-2xl font-bold">{activeItems}</p>
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
                <TableHead>Client</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Sort</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    Loading testimonials...
                  </TableCell>
                </TableRow>
              ) : !testimonials || testimonials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No testimonials yet. Click "Add Testimonial" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                testimonials.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{item.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {[item.clientRole, item.companyName].filter(Boolean).join(' • ') || '—'}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[420px] mt-1">
                          {item.quote}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.rating == null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Badge variant="outline" className="gap-1.5">
                          <Star className="h-3.5 w-3.5 text-amber-500" />
                          {item.rating}/5
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{item.sortOrder}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleToggleActive(item)}>
                            <Power className="mr-2 h-4 w-4" />
                            {item.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteItem(item)}
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

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Testimonial</DialogTitle>
            <DialogDescription>
              Update testimonial details. Active testimonials are visible on the website immediately.
            </DialogDescription>
          </DialogHeader>
          <TestimonialFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteItem} onOpenChange={(open) => { if (!open) setDeleteItem(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Testimonial</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete testimonial from <strong>{deleteItem?.clientName}</strong>? This action cannot be undone.
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

function TestimonialFormFields({
  form,
  setForm,
}: {
  form: TestimonialFormState;
  setForm: React.Dispatch<React.SetStateAction<TestimonialFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Client Name</Label>
          <Input
            placeholder="e.g. Jane Doe"
            value={form.clientName}
            onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Client Role</Label>
          <Input
            placeholder="e.g. Head of Growth"
            value={form.clientRole}
            onChange={(e) => setForm((f) => ({ ...f, clientRole: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Company Name</Label>
          <Input
            placeholder="e.g. Acme Inc"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Rating (1-5)</Label>
          <Input
            type="number"
            min={1}
            max={5}
            placeholder="Optional"
            value={form.rating}
            onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Avatar URL</Label>
        <Input
          placeholder="https://example.com/avatar.jpg"
          value={form.avatarUrl}
          onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Quote</Label>
        <Textarea
          rows={6}
          placeholder="Write the testimonial quote..."
          value={form.quote}
          onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          <Label>Active</Label>
        </div>
      </div>
    </div>
  );
}
