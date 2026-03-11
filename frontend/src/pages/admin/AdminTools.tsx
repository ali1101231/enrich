import { useState } from 'react';
import {
  Plus,
  Wrench,
  MoreVertical,
  Pencil,
  Trash2,
  Coins,
  Power,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminTools,
  useAdminCreateTool,
  useAdminUpdateTool,
  useAdminDeleteTool,
} from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import type { AdminToolItem } from '@/lib/api';

interface ToolFormState {
  toolId: string;
  name: string;
  description: string;
  creditCost: string;
  isActive: boolean;
}

const emptyForm: ToolFormState = {
  toolId: '',
  name: '',
  description: '',
  creditCost: '1',
  isActive: true,
};

export default function AdminTools() {
  const { toast } = useToast();
  const { data: tools, isLoading } = useAdminTools();
  const createMutation = useAdminCreateTool();
  const updateMutation = useAdminUpdateTool();
  const deleteMutation = useAdminDeleteTool();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTool, setEditTool] = useState<AdminToolItem | null>(null);
  const [deleteTool, setDeleteTool] = useState<AdminToolItem | null>(null);

  const [createForm, setCreateForm] = useState<ToolFormState>({ ...emptyForm });
  const [editForm, setEditForm] = useState<ToolFormState>({ ...emptyForm });

  const resetCreateForm = () => setCreateForm({ ...emptyForm });

  const handleCreate = async () => {
    const creditCost = parseInt(createForm.creditCost, 10);
    if (!createForm.toolId || !createForm.name) {
      toast({ title: 'Validation error', description: 'Tool ID and Name are required.', variant: 'destructive' });
      return;
    }
    if (isNaN(creditCost) || creditCost < 0) {
      toast({ title: 'Validation error', description: 'Credit cost must be a non-negative number.', variant: 'destructive' });
      return;
    }
    try {
      await createMutation.mutateAsync({
        toolId: createForm.toolId,
        name: createForm.name,
        description: createForm.description || undefined,
        creditCost,
      });
      toast({ title: 'Tool created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch {
      toast({ title: 'Failed to create tool', variant: 'destructive' });
    }
  };

  const openEdit = (tool: AdminToolItem) => {
    setEditTool(tool);
    setEditForm({
      toolId: tool.toolId,
      name: tool.name,
      description: tool.description ?? '',
      creditCost: String(tool.creditCost),
      isActive: tool.isActive,
    });
  };

  const handleEdit = async () => {
    if (!editTool) return;
    const creditCost = parseInt(editForm.creditCost, 10);
    if (isNaN(creditCost) || creditCost < 0) {
      toast({ title: 'Validation error', description: 'Credit cost must be a non-negative number.', variant: 'destructive' });
      return;
    }
    try {
      await updateMutation.mutateAsync({
        id: editTool.id,
        data: {
          name: editForm.name || undefined,
          description: editForm.description || null,
          creditCost,
          isActive: editForm.isActive,
        },
      });
      toast({ title: 'Tool updated' });
      setEditTool(null);
    } catch {
      toast({ title: 'Failed to update tool', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTool) return;
    try {
      await deleteMutation.mutateAsync(deleteTool.id);
      toast({ title: 'Tool deleted' });
      setDeleteTool(null);
    } catch {
      toast({ title: 'Failed to delete tool', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tools</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage tools and set credit cost per URL for each tool.
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreateForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Tool
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Tool</DialogTitle>
              <DialogDescription>Configure a new tool with its credit cost per URL.</DialogDescription>
            </DialogHeader>
            <ToolFormFields form={createForm} setForm={setCreateForm} isCreate />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Tool'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tools</p>
                <p className="text-2xl font-bold">{tools?.length ?? 0}</p>
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
                <p className="text-sm text-muted-foreground">Active Tools</p>
                <p className="text-2xl font-bold">{tools?.filter(t => t.isActive).length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Coins className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Credit Cost</p>
                <p className="text-2xl font-bold">
                  {tools && tools.length > 0
                    ? (tools.reduce((sum, t) => sum + t.creditCost, 0) / tools.length).toFixed(1)
                    : '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-center">Credit / URL</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Loading tools...
                  </TableCell>
                </TableRow>
              ) : !tools || tools.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No tools configured yet. Click "Add Tool" to get started.
                  </TableCell>
                </TableRow>
              ) : (
                tools.map((tool) => (
                  <TableRow key={tool.id}>
                    <TableCell>
                      <code className="text-xs bg-secondary px-2 py-1 rounded font-mono">{tool.toolId}</code>
                    </TableCell>
                    <TableCell className="font-medium">{tool.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {tool.description || '—'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-semibold text-lg">{tool.creditCost}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={tool.isActive ? 'default' : 'secondary'} className={cn(
                        tool.isActive && 'bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20',
                        !tool.isActive && 'bg-gray-500/10 text-gray-500'
                      )}>
                        {tool.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(tool.createdAt), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(tool)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTool(tool)}
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

      {/* Edit Dialog */}
      <Dialog open={!!editTool} onOpenChange={(open) => { if (!open) setEditTool(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tool</DialogTitle>
            <DialogDescription>Update the tool configuration and credit cost.</DialogDescription>
          </DialogHeader>
          <ToolFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTool(null)}>Cancel</Button>
            <Button onClick={handleEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTool} onOpenChange={(open) => { if (!open) setDeleteTool(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tool</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteTool?.name}</strong>? This will reset its credit cost to the default (1 credit/URL).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ToolFormFields({
  form,
  setForm,
  isCreate,
}: {
  form: ToolFormState;
  setForm: React.Dispatch<React.SetStateAction<ToolFormState>>;
  isCreate?: boolean;
}) {
  return (
    <div className="space-y-4 py-2">
      {/* Tool ID */}
      <div className="space-y-2">
        <Label>Tool ID</Label>
        <Input
          placeholder="e.g. blitz-email-enricher"
          value={form.toolId}
          onChange={(e) => setForm((f) => ({ ...f, toolId: e.target.value }))}
          disabled={!isCreate}
          className={cn(!isCreate && 'opacity-60')}
        />
        {isCreate && (
          <p className="text-xs text-muted-foreground">Must match the tool ID used in the system (e.g. blitz-email-enricher).</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          placeholder="e.g. Email Enricher"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Brief description of what this tool does..."
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={2}
        />
      </div>

      {/* Credit Cost */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-500" />
          Credits per URL
        </Label>
        <Input
          type="number"
          min={0}
          placeholder="1"
          value={form.creditCost}
          onChange={(e) => setForm((f) => ({ ...f, creditCost: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">
          How many credits to deduct for each URL/row processed by this tool.
        </p>
      </div>

      {/* Active toggle (only for edit) */}
      {!isCreate && (
        <div className="flex items-center gap-3 pt-2">
          <Switch
            checked={form.isActive}
            onCheckedChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          <Label>Active</Label>
        </div>
      )}
    </div>
  );
}
