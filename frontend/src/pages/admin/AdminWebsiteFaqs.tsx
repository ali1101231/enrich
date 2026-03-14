import { useState } from 'react';
import {
  Plus,
  HelpCircle,
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
  useAdminWebsiteFaqs,
  useAdminCreateWebsiteFaq,
  useAdminUpdateWebsiteFaq,
  useAdminDeleteWebsiteFaq,
} from '@/hooks/useApi';
import type { AdminWebsiteFaqItem } from '@/lib/api';

interface FaqFormState {
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: FaqFormState = {
  question: '',
  answer: '',
  isActive: true,
  sortOrder: '0',
};

export default function AdminWebsiteFaqs() {
  const { toast } = useToast();
  const { data: faqs, isLoading } = useAdminWebsiteFaqs();
  const createMutation = useAdminCreateWebsiteFaq();
  const updateMutation = useAdminUpdateWebsiteFaq();
  const deleteMutation = useAdminDeleteWebsiteFaq();

  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<AdminWebsiteFaqItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AdminWebsiteFaqItem | null>(null);

  const [createForm, setCreateForm] = useState<FaqFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<FaqFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseForm = (form: FaqFormState) => {
    if (!form.question.trim()) {
      throw new Error('Question is required.');
    }
    if (!form.answer.trim()) {
      throw new Error('Answer is required.');
    }

    const sortOrder = parseInt(form.sortOrder, 10);
    if (isNaN(sortOrder) || sortOrder < 0) {
      throw new Error('Sort order must be a non-negative integer.');
    }

    return {
      question: form.question.trim(),
      answer: form.answer.trim(),
      isActive: form.isActive,
      sortOrder,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'FAQ created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to create FAQ';
      toast({ title: 'Create failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (item: AdminWebsiteFaqItem) => {
    setEditItem(item);
    setEditForm({
      question: item.question,
      answer: item.answer,
      isActive: item.isActive,
      sortOrder: String(item.sortOrder),
    });
  };

  const handleEdit = async () => {
    if (!editItem) return;

    try {
      const data = parseForm(editForm);
      await updateMutation.mutateAsync({
        faqId: editItem.id,
        data,
      });
      toast({ title: 'FAQ updated' });
      setEditItem(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update FAQ';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      await deleteMutation.mutateAsync(deleteItem.id);
      toast({ title: 'FAQ deleted' });
      setDeleteItem(null);
    } catch {
      toast({ title: 'Failed to delete FAQ', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (item: AdminWebsiteFaqItem) => {
    try {
      await updateMutation.mutateAsync({
        faqId: item.id,
        data: { isActive: !item.isActive },
      });
      toast({ title: item.isActive ? 'FAQ deactivated' : 'FAQ activated' });
    } catch {
      toast({ title: 'Failed to update FAQ', variant: 'destructive' });
    }
  };

  const totalItems = faqs?.length ?? 0;
  const activeItems = faqs?.filter((item) => item.isActive).length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website FAQs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage FAQ content shown on the website.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add FAQ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create FAQ</DialogTitle>
              <DialogDescription>
                Add a new FAQ with question, answer, visibility and sort order.
              </DialogDescription>
            </DialogHeader>
            <FaqFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create FAQ'}
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
                <HelpCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total FAQs</p>
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
                <p className="text-sm text-muted-foreground">Active FAQs</p>
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
                <TableHead>FAQ</TableHead>
                <TableHead className="text-center">Sort</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    Loading FAQs...
                  </TableCell>
                </TableRow>
              ) : !faqs || faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No FAQs yet. Click "Add FAQ" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium line-clamp-1 max-w-[460px]">{item.question}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[520px] whitespace-pre-wrap">
                          {item.answer}
                        </p>
                      </div>
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
            <DialogTitle>Edit FAQ</DialogTitle>
            <DialogDescription>
              Update FAQ details. Active FAQs are visible on the website immediately.
            </DialogDescription>
          </DialogHeader>
          <FaqFormFields form={editForm} setForm={setEditForm} />
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
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
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

function FaqFormFields({
  form,
  setForm,
}: {
  form: FaqFormState;
  setForm: React.Dispatch<React.SetStateAction<FaqFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Question</Label>
        <Input
          placeholder="e.g. How does billing work?"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Answer</Label>
        <Textarea
          rows={8}
          placeholder="Write the FAQ answer..."
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
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
