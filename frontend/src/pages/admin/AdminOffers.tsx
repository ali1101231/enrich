import { useState } from 'react';
import {
  Plus,
  Tag,
  Coins,
  Users,
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
  useAdminOffers,
  useAdminCreateOffer,
  useAdminUpdateOffer,
  useAdminDeleteOffer,
} from '@/hooks/useApi';
import type { AdminOfferItem } from '@/lib/api';

interface OfferFormState {
  title: string;
  description: string;
  credits: string;
  maxRedemptions: string;
  isActive: boolean;
}

const emptyForm: OfferFormState = {
  title: '',
  description: '',
  credits: '100',
  maxRedemptions: '100',
  isActive: true,
};

export default function AdminOffers() {
  const { toast } = useToast();
  const { data: offers, isLoading } = useAdminOffers();
  const createMutation = useAdminCreateOffer();
  const updateMutation = useAdminUpdateOffer();
  const deleteMutation = useAdminDeleteOffer();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<AdminOfferItem | null>(null);
  const [deleteOffer, setDeleteOffer] = useState<AdminOfferItem | null>(null);

  const [createForm, setCreateForm] = useState<OfferFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<OfferFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseOfferForm = (form: OfferFormState) => {
    const credits = parseInt(form.credits, 10);
    const maxRedemptions = parseInt(form.maxRedemptions, 10);

    if (!form.title.trim()) {
      throw new Error('Title is required.');
    }
    if (isNaN(credits) || credits < 1) {
      throw new Error('Credits must be at least 1.');
    }
    if (isNaN(maxRedemptions) || maxRedemptions < 1) {
      throw new Error('Max avails must be at least 1.');
    }

    return {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      credits,
      maxRedemptions,
      isActive: form.isActive,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseOfferForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'Offer created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to create offer';
      toast({ title: 'Create failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (offer: AdminOfferItem) => {
    setEditOffer(offer);
    setEditForm({
      title: offer.title,
      description: offer.description ?? '',
      credits: String(offer.credits),
      maxRedemptions: String(offer.maxRedemptions),
      isActive: offer.isActive,
    });
  };

  const handleEdit = async () => {
    if (!editOffer) return;

    try {
      const data = parseOfferForm(editForm);
      await updateMutation.mutateAsync({
        offerId: editOffer.id,
        data: {
          ...data,
          description: data.description ?? null,
        },
      });
      toast({ title: 'Offer updated' });
      setEditOffer(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update offer';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteOffer) return;

    try {
      await deleteMutation.mutateAsync(deleteOffer.id);
      toast({ title: 'Offer deleted' });
      setDeleteOffer(null);
    } catch {
      toast({ title: 'Failed to delete offer', variant: 'destructive' });
    }
  };

  const totalOffers = offers?.length ?? 0;
  const activeOffers = offers?.filter((offer) => offer.isActive).length ?? 0;
  const totalClaims = offers?.reduce((sum, offer) => sum + offer.redeemedCount, 0) ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Create and manage offer campaigns with credits and redemption limits.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Offer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Offer</DialogTitle>
              <DialogDescription>
                Configure a new offer with description, credits, and max number of users who can avail it.
              </DialogDescription>
            </DialogHeader>
            <OfferFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Offer'}
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
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Offers</p>
                <p className="text-2xl font-bold">{totalOffers}</p>
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
                <p className="text-sm text-muted-foreground">Active Offers</p>
                <p className="text-2xl font-bold">{activeOffers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Users className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Claims</p>
                <p className="text-2xl font-bold">{totalClaims}</p>
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
                <TableHead>Offer</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-center">Max Avails</TableHead>
                <TableHead className="text-center">Availed</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading offers...
                  </TableCell>
                </TableRow>
              ) : !offers || offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No offers yet. Click "Add Offer" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{offer.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
                          {offer.description || '—'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold">{offer.credits}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-medium">{offer.maxRedemptions}</TableCell>
                    <TableCell className="text-center font-medium">
                      {offer.redeemedCount} / {offer.maxRedemptions}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={offer.isActive ? 'default' : 'secondary'}
                        className={cn(
                          offer.isActive && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
                          !offer.isActive && 'bg-gray-500/10 text-gray-500'
                        )}
                      >
                        {offer.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(offer.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(offer)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteOffer(offer)}
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

      <Dialog open={!!editOffer} onOpenChange={(open) => { if (!open) setEditOffer(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Offer</DialogTitle>
            <DialogDescription>
              Update offer details, credit amount, and how many users can still avail it.
            </DialogDescription>
          </DialogHeader>
          <OfferFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOffer(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteOffer} onOpenChange={(open) => { if (!open) setDeleteOffer(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Offer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteOffer?.title}</strong>? This action cannot be undone.
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

function OfferFormFields({
  form,
  setForm,
}: {
  form: OfferFormState;
  setForm: React.Dispatch<React.SetStateAction<OfferFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Offer Title</Label>
        <Input
          placeholder="e.g. New Year Bonus"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Describe the offer details for users..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Credits</Label>
          <Input
            type="number"
            min={1}
            value={form.credits}
            onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Max Avails</Label>
          <Input
            type="number"
            min={1}
            value={form.maxRedemptions}
            onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
          />
        </div>
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
