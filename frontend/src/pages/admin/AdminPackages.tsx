import { useState } from 'react';
import {
  Plus,
  Package,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Power,
  Pencil,
  Trash2,
  Star,
  CreditCard,
  Coins,
  X,
  Sparkles,
} from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminPackages,
  useAdminCreatePackage,
  useAdminUpdatePackage,
  useAdminDeletePackage,
} from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import type { PackageItem } from '@/lib/api';

interface PackageFormState {
  name: string;
  credits: string;
  monthlyPrice: string;
  yearlyPrice: string;
  isTopLevel: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  badge: string;
  subtitle: string;
  buttonText: string;
  features: string[];
  sortOrder: string;
  newFeature: string;
}

const emptyForm: PackageFormState = {
  name: '',
  credits: '',
  monthlyPrice: '',
  yearlyPrice: '',
  isTopLevel: false,
  isHighlighted: false,
  isActive: true,
  badge: '',
  subtitle: '',
  buttonText: 'Get Started',
  features: [],
  sortOrder: '0',
  newFeature: '',
};

function PackageFormFields({
  form,
  setForm,
}: {
  form: PackageFormState;
  setForm: React.Dispatch<React.SetStateAction<PackageFormState>>;
}) {
  const addFeature = () => {
    const f = form.newFeature.trim();
    if (!f) return;
    setForm((s) => ({ ...s, features: [...s.features, f], newFeature: '' }));
  };

  const removeFeature = (idx: number) => {
    setForm((s) => ({ ...s, features: s.features.filter((_, i) => i !== idx) }));
  };

  return (
    <ScrollArea className="max-h-[60vh] pr-3">
      <div className="space-y-4 py-2">
        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input placeholder="e.g. Starter" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Credits */}
        <div className="space-y-2">
          <Label>Credits</Label>
          <Input type="number" min={0} placeholder="100000" value={form.credits} onChange={(e) => setForm((f) => ({ ...f, credits: e.target.value }))} />
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Monthly Price ($)</Label>
            <Input type="number" min={0} step="0.01" placeholder="29.00" value={form.monthlyPrice} onChange={(e) => setForm((f) => ({ ...f, monthlyPrice: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Yearly Price ($/mo)</Label>
            <Input type="number" min={0} step="0.01" placeholder="24.00" value={form.yearlyPrice} onChange={(e) => setForm((f) => ({ ...f, yearlyPrice: e.target.value }))} />
          </div>
        </div>

        {/* Subtitle */}
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Textarea placeholder="Short description shown on pricing card..." value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
        </div>

        {/* Badge & Button text */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Badge</Label>
            <Input placeholder="e.g. MOST POPULAR" value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input value={form.buttonText} onChange={(e) => setForm((f) => ({ ...f, buttonText: e.target.value }))} />
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a feature..."
              value={form.newFeature}
              onChange={(e) => setForm((f) => ({ ...f, newFeature: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
            />
            <Button type="button" variant="outline" size="sm" onClick={addFeature}>Add</Button>
          </div>
          {form.features.length > 0 && (
            <div className="space-y-1 mt-2">
              {form.features.map((feat, idx) => (
                <div key={idx} className="flex items-center justify-between bg-secondary/50 rounded px-3 py-1.5 text-sm">
                  <span>{feat}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFeature(idx)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sort & Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-3">
              <Switch checked={form.isHighlighted} onCheckedChange={(v) => setForm((f) => ({ ...f, isHighlighted: v }))} />
              <Label>Highlighted</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isTopLevel} onCheckedChange={(v) => setForm((f) => ({ ...f, isTopLevel: v }))} />
              <Label>Top-level</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))} />
              <Label>Active</Label>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export default function AdminPackages() {
  const { toast } = useToast();
  const { data: packages, isLoading } = useAdminPackages();
  const createMutation = useAdminCreatePackage();
  const updateMutation = useAdminUpdatePackage();
  const deleteMutation = useAdminDeletePackage();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<PackageItem | null>(null);
  const [deletePkg, setDeletePkg] = useState<PackageItem | null>(null);

  const [createForm, setCreateForm] = useState<PackageFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<PackageFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const handleCreate = async () => {
    const credits = parseInt(createForm.credits, 10);
    const monthlyPrice = parseFloat(createForm.monthlyPrice);
    const yearlyPrice = parseFloat(createForm.yearlyPrice);
    const sortOrder = parseInt(createForm.sortOrder, 10);
    if (!createForm.name || isNaN(credits) || isNaN(monthlyPrice) || isNaN(yearlyPrice)) {
      toast({ title: 'Validation error', description: 'Name, credits, monthly price, and yearly price are required.', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: createForm.name,
        credits,
        monthlyPrice,
        yearlyPrice,
        isTopLevel: createForm.isTopLevel,
        isHighlighted: createForm.isHighlighted,
        badge: createForm.badge || undefined,
        subtitle: createForm.subtitle || undefined,
        buttonText: createForm.buttonText || undefined,
        features: createForm.features,
        sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
      });
      toast({ title: 'Package created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch {
      toast({ title: 'Failed to create package', variant: 'destructive' });
    }
  };

  const openEdit = (pkg: PackageItem) => {
    setEditPkg(pkg);
    setEditForm({
      name: pkg.name,
      credits: String(pkg.credits),
      monthlyPrice: String(pkg.monthlyPrice),
      yearlyPrice: String(pkg.yearlyPrice),
      isTopLevel: pkg.isTopLevel,
      isHighlighted: pkg.isHighlighted,
      isActive: pkg.isActive,
      badge: pkg.badge ?? '',
      subtitle: pkg.subtitle ?? '',
      buttonText: pkg.buttonText,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      sortOrder: String(pkg.sortOrder),
      newFeature: '',
    });
  };

  const handleUpdate = async () => {
    if (!editPkg) return;
    const credits = parseInt(editForm.credits, 10);
    const monthlyPrice = parseFloat(editForm.monthlyPrice);
    const yearlyPrice = parseFloat(editForm.yearlyPrice);
    const sortOrder = parseInt(editForm.sortOrder, 10);
    if (!editForm.name || isNaN(credits) || isNaN(monthlyPrice) || isNaN(yearlyPrice)) {
      toast({ title: 'Validation error', description: 'Name, credits, monthly price, and yearly price are required.', variant: 'destructive' });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        packageId: editPkg.id,
        data: {
          name: editForm.name,
          credits,
          monthlyPrice,
          yearlyPrice,
          isTopLevel: editForm.isTopLevel,
          isActive: editForm.isActive,
          isHighlighted: editForm.isHighlighted,
          badge: editForm.badge || null,
          subtitle: editForm.subtitle || null,
          buttonText: editForm.buttonText || 'Get Started',
          features: editForm.features,
          sortOrder: isNaN(sortOrder) ? 0 : sortOrder,
        },
      });
      toast({ title: 'Package updated' });
      setEditPkg(null);
    } catch {
      toast({ title: 'Failed to update package', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deletePkg) return;
    try {
      await deleteMutation.mutateAsync(deletePkg.id);
      toast({ title: 'Package deleted' });
      setDeletePkg(null);
    } catch {
      toast({ title: 'Failed to delete package', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (pkg: PackageItem) => {
    try {
      await updateMutation.mutateAsync({
        packageId: pkg.id,
        data: { isActive: !pkg.isActive },
      });
      toast({ title: pkg.isActive ? 'Package deactivated' : 'Package activated' });
    } catch {
      toast({ title: 'Failed to update package', variant: 'destructive' });
    }
  };

  const activeCount = packages?.filter((p) => p.isActive).length ?? 0;
  const highlightedCount = packages?.filter((p) => p.isHighlighted).length ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Packages</h1>
          <p className="text-muted-foreground">
            Manage pricing packages — credits, pricing, features, and visibility on the pricing page.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Package</DialogTitle>
              <DialogDescription>Add a new pricing package. Active packages appear on the pricing page.</DialogDescription>
            </DialogHeader>
            <PackageFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Packages</p>
              <p className="text-xl font-bold">{packages?.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-bold">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
              <Sparkles className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Highlighted</p>
              <p className="text-xl font-bold">{highlightedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading packages...</div>
      ) : !packages?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">No packages yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first package to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onEdit={() => openEdit(pkg)}
              onDelete={() => setDeletePkg(pkg)}
              onToggleActive={() => handleToggleActive(pkg)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editPkg} onOpenChange={(open) => { if (!open) setEditPkg(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Package</DialogTitle>
            <DialogDescription>Modify package details. Changes appear on the pricing page immediately.</DialogDescription>
          </DialogHeader>
          <PackageFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPkg(null)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePkg} onOpenChange={(open) => { if (!open) setDeletePkg(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Package</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletePkg?.name}"? This action cannot be undone.
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

function PackageCard({
  pkg,
  onEdit,
  onDelete,
  onToggleActive,
}: {
  pkg: PackageItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const features = Array.isArray(pkg.features) ? pkg.features : [];

  return (
    <Card className={cn(!pkg.isActive && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold truncate">{pkg.name}</p>
                {pkg.isHighlighted && (
                  <Badge variant="secondary" className="shrink-0 text-warning">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Highlighted
                  </Badge>
                )}
                {pkg.badge && (
                  <Badge variant="secondary" className="shrink-0">{pkg.badge}</Badge>
                )}
                <Badge
                  variant="secondary"
                  className={cn('shrink-0', pkg.isActive ? 'text-success' : 'text-destructive')}
                >
                  {pkg.isActive ? (
                    <><CheckCircle2 className="h-3 w-3 mr-1" />Active</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Inactive</>
                  )}
                </Badge>
              </div>
              {pkg.subtitle && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{pkg.subtitle}</p>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-2" />Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                <Power className="h-4 w-4 mr-2" />
                {pkg.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Pricing & Credits */}
        <div className="flex items-center gap-4 text-sm mb-2">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Coins className="h-4 w-4" />
            <span>{pkg.credits.toLocaleString()} credits</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <CreditCard className="h-4 w-4" />
            <span>${pkg.monthlyPrice}/mo · ${pkg.yearlyPrice}/mo yearly</span>
          </div>
        </div>

        {/* Features preview */}
        {features.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1">
            {features.length} feature{features.length !== 1 ? 's' : ''}: {features.slice(0, 2).join(', ')}{features.length > 2 ? `, +${features.length - 2} more` : ''}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2">
          Added {formatDistanceToNow(new Date(pkg.createdAt), { addSuffix: true })}
        </div>
      </CardContent>
    </Card>
  );
}
