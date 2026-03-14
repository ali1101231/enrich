import { useState } from 'react';
import {
  Plus,
  Image,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  Link as LinkIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  useAdminWebsiteLogos,
  useAdminCreateWebsiteLogo,
  useAdminUpdateWebsiteLogo,
  useAdminDeleteWebsiteLogo,
} from '@/hooks/useApi';
import type { AdminWebsiteLogoItem } from '@/lib/api';

interface LogoFormState {
  name: string;
  imageUrl: string;
  altText: string;
  href: string;
  isActive: boolean;
  sortOrder: string;
}

const emptyForm: LogoFormState = {
  name: '',
  imageUrl: '',
  altText: '',
  href: '',
  isActive: true,
  sortOrder: '0',
};

export default function AdminWebsiteLogos() {
  const { toast } = useToast();
  const { data: logos, isLoading } = useAdminWebsiteLogos();
  const createMutation = useAdminCreateWebsiteLogo();
  const updateMutation = useAdminUpdateWebsiteLogo();
  const deleteMutation = useAdminDeleteWebsiteLogo();

  const [createOpen, setCreateOpen] = useState(false);
  const [editLogo, setEditLogo] = useState<AdminWebsiteLogoItem | null>(null);
  const [deleteLogo, setDeleteLogo] = useState<AdminWebsiteLogoItem | null>(null);

  const [createForm, setCreateForm] = useState<LogoFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<LogoFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const parseLogoForm = (form: LogoFormState) => {
    if (!form.name.trim()) {
      throw new Error('Name is required.');
    }
    if (!form.imageUrl.trim()) {
      throw new Error('Image URL is required.');
    }

    const sortOrder = parseInt(form.sortOrder, 10);
    if (isNaN(sortOrder) || sortOrder < 0) {
      throw new Error('Sort order must be a non-negative integer.');
    }

    return {
      name: form.name.trim(),
      imageUrl: form.imageUrl.trim(),
      altText: form.altText.trim() || null,
      href: form.href.trim() || null,
      isActive: form.isActive,
      sortOrder,
    };
  };

  const handleCreate = async () => {
    try {
      const data = parseLogoForm(createForm);
      await createMutation.mutateAsync(data);
      toast({ title: 'Logo created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to create logo';
      toast({ title: 'Create failed', description, variant: 'destructive' });
    }
  };

  const openEdit = (logo: AdminWebsiteLogoItem) => {
    setEditLogo(logo);
    setEditForm({
      name: logo.name,
      imageUrl: logo.imageUrl,
      altText: logo.altText ?? '',
      href: logo.href ?? '',
      isActive: logo.isActive,
      sortOrder: String(logo.sortOrder),
    });
  };

  const handleEdit = async () => {
    if (!editLogo) return;

    try {
      const data = parseLogoForm(editForm);
      await updateMutation.mutateAsync({
        logoId: editLogo.id,
        data,
      });
      toast({ title: 'Logo updated' });
      setEditLogo(null);
    } catch (error) {
      const description = error instanceof Error ? error.message : 'Failed to update logo';
      toast({ title: 'Update failed', description, variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteLogo) return;

    try {
      await deleteMutation.mutateAsync(deleteLogo.id);
      toast({ title: 'Logo deleted' });
      setDeleteLogo(null);
    } catch {
      toast({ title: 'Failed to delete logo', variant: 'destructive' });
    }
  };

  const handleToggleActive = async (logo: AdminWebsiteLogoItem) => {
    try {
      await updateMutation.mutateAsync({
        logoId: logo.id,
        data: { isActive: !logo.isActive },
      });
      toast({ title: logo.isActive ? 'Logo deactivated' : 'Logo activated' });
    } catch {
      toast({ title: 'Failed to update logo', variant: 'destructive' });
    }
  };

  const totalLogos = logos?.length ?? 0;
  const activeLogos = logos?.filter((logo) => logo.isActive).length ?? 0;

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Logos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage logo strip content shown on the website.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Logo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Logo</DialogTitle>
              <DialogDescription>
                Add a new logo card with image, optional link, visibility and order.
              </DialogDescription>
            </DialogHeader>
            <LogoFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Logo'}
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
                <Image className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Logos</p>
                <p className="text-2xl font-bold">{totalLogos}</p>
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
                <p className="text-sm text-muted-foreground">Active Logos</p>
                <p className="text-2xl font-bold">{activeLogos}</p>
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
                <TableHead>Logo</TableHead>
                <TableHead className="text-center">Link</TableHead>
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
                    Loading logos...
                  </TableCell>
                </TableRow>
              ) : !logos || logos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No logos yet. Click "Add Logo" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                logos.map((logo) => (
                  <TableRow key={logo.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md border bg-muted/30 overflow-hidden flex items-center justify-center">
                          <img
                            src={logo.imageUrl}
                            alt={logo.altText ?? logo.name}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              (event.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{logo.name}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[320px]">
                            {logo.imageUrl}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {logo.href ? (
                        <Badge variant="outline" className="gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5" />
                          Linked
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-medium">{logo.sortOrder}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={logo.isActive ? 'default' : 'secondary'}
                        className={cn(
                          logo.isActive && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
                          !logo.isActive && 'bg-gray-500/10 text-gray-500'
                        )}
                      >
                        {logo.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(logo.updatedAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(logo)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleActive(logo)}>
                            <Power className="mr-2 h-4 w-4" />
                            {logo.isActive ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteLogo(logo)}
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

      <Dialog open={!!editLogo} onOpenChange={(open) => { if (!open) setEditLogo(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Logo</DialogTitle>
            <DialogDescription>
              Update logo details. Active logos are shown on the website immediately.
            </DialogDescription>
          </DialogHeader>
          <LogoFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditLogo(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteLogo} onOpenChange={(open) => { if (!open) setDeleteLogo(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Logo</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteLogo?.name}</strong>? This action cannot be undone.
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

function LogoFormFields({
  form,
  setForm,
}: {
  form: LogoFormState;
  setForm: React.Dispatch<React.SetStateAction<LogoFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          placeholder="e.g. Acme Inc"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Image URL</Label>
        <Input
          placeholder="https://example.com/logo.png"
          value={form.imageUrl}
          onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Alt Text</Label>
        <Input
          placeholder="Optional alt text"
          value={form.altText}
          onChange={(e) => setForm((f) => ({ ...f, altText: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Href</Label>
        <Input
          placeholder="https://example.com"
          value={form.href}
          onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
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
