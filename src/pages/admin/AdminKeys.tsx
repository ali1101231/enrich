import { useState } from 'react';
import {
  Plus,
  Key,
  Trash2,
  Edit2,
  MoreVertical,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAdmin, AdminKey } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';

const statusConfig = {
  active: { icon: CheckCircle2, color: 'text-success', label: 'Active' },
  'rate-limited': { icon: AlertCircle, color: 'text-warning', label: 'Rate Limited' },
  invalid: { icon: XCircle, color: 'text-destructive', label: 'Invalid' },
};

function KeyCard({
  keyData,
  onEdit,
  onDelete,
}: {
  keyData: AdminKey;
  onEdit: (id: string, updates: Partial<AdminKey>) => void;
  onDelete: (id: string) => void;
}) {
  const config = statusConfig[keyData.status];
  const StatusIcon = config.icon;
  const [editOpen, setEditOpen] = useState(false);
  const [editLabel, setEditLabel] = useState(keyData.label);
  const [editCredits, setEditCredits] = useState(keyData.creditsTotal.toString());
  const creditPercent = (keyData.creditsUsed / keyData.creditsTotal) * 100;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{keyData.label}</p>
                <Badge variant="secondary" className={cn('shrink-0', config.color)}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono truncate">{keyData.keyMasked}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Key
              </DropdownMenuItem>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this key?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the key from all assigned users. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(keyData.id)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Credit Usage */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Credits Used</span>
            <span className="font-medium">
              {(keyData.creditsUsed / 1000).toFixed(0)}K / {(keyData.creditsTotal / 1000).toFixed(0)}K
            </span>
          </div>
          <Progress value={creditPercent} className="h-2" />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{keyData.assignedUserCount} users</span>
          </div>
          {keyData.lastUsedAt && (
            <div className="text-muted-foreground">
              Last used {formatDistanceToNow(new Date(keyData.lastUsedAt), { addSuffix: true })}
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Key</DialogTitle>
              <DialogDescription>Update the key label and credit limit</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g., Primary Pool Key"
                />
              </div>
              <div className="space-y-2">
                <Label>Total Credits</Label>
                <Input
                  type="number"
                  value={editCredits}
                  onChange={(e) => setEditCredits(e.target.value)}
                  placeholder="e.g., 1000000"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onEdit(keyData.id, {
                    label: editLabel,
                    creditsTotal: parseInt(editCredits),
                  });
                  setEditOpen(false);
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AddKeyDialog({ onAdd }: { onAdd: (label: string, key: string, credits: number) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [credits, setCredits] = useState('1000000');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (label && keyValue && credits) {
      onAdd(label, keyValue, parseInt(credits));
      setLabel('');
      setKeyValue('');
      setCredits('1000000');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add API Key to Pool</DialogTitle>
          <DialogDescription>
            Add a new Blitz API key that can be assigned to users
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Primary Pool Key"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="blitz_..."
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Credit Limit</Label>
            <Input
              type="number"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="e.g., 1000000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label || !keyValue || !credits}>
            Add Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminKeys() {
  const { keys, addKey, updateKey, deleteKey, stats } = useAdmin();

  const totalKeyCredits = keys.reduce((acc, k) => acc + k.creditsTotal, 0);
  const totalKeyUsed = keys.reduce((acc, k) => acc + k.creditsUsed, 0);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Keys Pool</h1>
          <p className="text-muted-foreground">Manage shared API keys for all users</p>
        </div>
        <AddKeyDialog onAdd={addKey} />
      </div>

      {/* Pool Summary */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Pool Summary</CardTitle>
          <CardDescription>Combined credits across all keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Pool Size</p>
              <p className="text-2xl font-bold">{(totalKeyCredits / 1000000).toFixed(1)}M credits</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Used</p>
              <p className="text-2xl font-bold">{(totalKeyUsed / 1000).toFixed(0)}K credits</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available</p>
              <p className="text-2xl font-bold text-success">
                {((totalKeyCredits - totalKeyUsed) / 1000).toFixed(0)}K credits
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keys List */}
      {keys.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="font-semibold text-lg">No API keys in pool</h3>
            <p className="text-muted-foreground mt-1 mb-4">
              Add your first API key to start assigning to users
            </p>
            <AddKeyDialog onAdd={addKey} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {keys.map((key) => (
            <KeyCard key={key.id} keyData={key} onEdit={updateKey} onDelete={deleteKey} />
          ))}
        </div>
      )}
    </div>
  );
}
