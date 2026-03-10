import { useState } from 'react';
import {
  Plus,
  Key,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Power,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdmin } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';
import type { AdminKeyItem } from '@/lib/api';

function KeyCard({
  keyData,
  onToggleActive,
}: {
  keyData: AdminKeyItem;
  onToggleActive: (id: string, isActive: boolean) => void;
}) {
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
                <Badge
                  variant="secondary"
                  className={cn(
                    'shrink-0',
                    keyData.isActive ? 'text-success' : 'text-destructive'
                  )}
                >
                  {keyData.isActive ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onToggleActive(keyData.id, !keyData.isActive)}
              >
                <Power className="h-4 w-4 mr-2" />
                {keyData.isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>
              {keyData.activeUsers}/{keyData.maxUsers} users
            </span>
          </div>
          <div className="text-muted-foreground">
            Added {formatDistanceToNow(new Date(keyData.createdAt), { addSuffix: true })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddKeyDialog({ onAdd }: { onAdd: (label: string, rawKey: string) => void }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (label && keyValue) {
      onAdd(label, keyValue);
      setLabel('');
      setKeyValue('');
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label || !keyValue}>
            Add Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminKeys() {
  const { keys, addKey, setKeyActive, stats } = useAdmin();

  const totalUsers = keys.reduce((acc, k) => acc + k.activeUsers, 0);
  const totalCapacity = keys.reduce((acc, k) => acc + k.maxUsers, 0);

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
          <CardDescription>Key usage across all keys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Total Keys</p>
              <p className="text-2xl font-bold">{keys.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Keys</p>
              <p className="text-2xl font-bold">{keys.filter(k => k.isActive).length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">User Slots</p>
              <p className="text-2xl font-bold text-success">
                {totalUsers} / {totalCapacity}
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
            <KeyCard key={key.id} keyData={key} onToggleActive={setKeyActive} />
          ))}
        </div>
      )}
    </div>
  );
}
