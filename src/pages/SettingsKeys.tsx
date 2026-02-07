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
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Zap,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useApp } from '@/contexts/AppContext';
import { ApifyKey, BlitzKey, KeyStatus } from '@/types';
import { formatDistanceToNow } from 'date-fns';

const statusConfig: Record<KeyStatus, { icon: React.ElementType; color: string; label: string }> = {
  active: { icon: CheckCircle2, color: 'text-success', label: 'Active' },
  'rate-limited': { icon: AlertCircle, color: 'text-warning', label: 'Rate Limited' },
  invalid: { icon: XCircle, color: 'text-destructive', label: 'Invalid' },
  checking: { icon: Loader2, color: 'text-muted-foreground', label: 'Checking...' },
};

function KeyCard({ 
  keyData, 
  type, 
  onEdit, 
  onDelete, 
  onToggle 
}: { 
  keyData: ApifyKey | BlitzKey;
  type: 'apify' | 'blitz';
  onEdit: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}) {
  const config = statusConfig[keyData.status];
  const StatusIcon = config.icon;
  const [editLabel, setEditLabel] = useState(keyData.label);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <Card className={cn(!keyData.enabled && 'opacity-60')}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              type === 'apify' ? 'bg-orange-500/10' : 'bg-blue-500/10'
            )}>
              {type === 'apify' ? (
                <Zap className="h-5 w-5 text-orange-500" />
              ) : (
                <Sparkles className="h-5 w-5 text-blue-500" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{keyData.label}</p>
                <Badge variant="secondary" className={cn('shrink-0', config.color)}>
                  <StatusIcon className={cn('h-3 w-3 mr-1', keyData.status === 'checking' && 'animate-spin')} />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground font-mono truncate">{keyData.keyMasked}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={keyData.enabled}
              onCheckedChange={(checked) => onToggle(keyData.id, checked)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Label
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onSelect={e => e.preventDefault()}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this key?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. Runs using this key will fail.
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
        </div>

        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-sm">
          <div>
            <p className="text-muted-foreground">Requests Today</p>
            <p className="font-medium">{keyData.requestsToday.toLocaleString()}</p>
          </div>
          {'successRate' in keyData && (
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-medium">{keyData.successRate}%</p>
            </div>
          )}
          {keyData.lastUsedAt && (
            <div>
              <p className="text-muted-foreground">Last Used</p>
              <p className="font-medium">
                {formatDistanceToNow(new Date(keyData.lastUsedAt), { addSuffix: true })}
              </p>
            </div>
          )}
          {'plan' in keyData && keyData.plan && (
            <div>
              <p className="text-muted-foreground">Plan</p>
              <p className="font-medium">{keyData.plan}</p>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Key Label</DialogTitle>
              <DialogDescription>
                Update the label for this API key
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  placeholder="e.g., Main Production"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                onEdit(keyData.id, editLabel);
                setEditOpen(false);
              }}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function AddKeyDialog({ 
  type, 
  onAdd, 
  trigger 
}: { 
  type: 'apify' | 'blitz';
  onAdd: (label: string, key: string) => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = () => {
    if (label && key) {
      onAdd(label, key);
      setLabel('');
      setKey('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add {type === 'apify' ? 'Apify' : 'Blitz'} Key</DialogTitle>
          <DialogDescription>
            Add a new API key to use with {type === 'apify' ? 'Apify' : 'Blitz'} tools
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Main Production"
            />
          </div>
          <div className="space-y-2">
            <Label>API Key</Label>
            <div className="relative">
              <Input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder={type === 'apify' ? 'apify_api_...' : 'blitz_...'}
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
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted text-sm">
            <Shield className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-muted-foreground">
              Your API key is encrypted and stored securely. It will never be exposed in the UI.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label || !key}>
            Add Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SettingsKeys() {
  const {
    apifyKeys,
    blitzKeys,
    addApifyKey,
    updateApifyKey,
    deleteApifyKey,
    addBlitzKey,
    updateBlitzKey,
    deleteBlitzKey,
  } = useApp();

  return (
    <div className="space-y-8">
      {/* Apify Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Apify Keys
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your Apify API keys for scraping tools
            </p>
          </div>
          <AddKeyDialog
            type="apify"
            onAdd={addApifyKey}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Key
              </Button>
            }
          />
        </div>
        
        {apifyKeys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No Apify keys</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add your Apify API key to start using scraping tools
              </p>
              <AddKeyDialog
                type="apify"
                onAdd={addApifyKey}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Key
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {apifyKeys.map(key => (
              <KeyCard
                key={key.id}
                keyData={key}
                type="apify"
                onEdit={(id, label) => updateApifyKey(id, { label })}
                onDelete={deleteApifyKey}
                onToggle={(id, enabled) => updateApifyKey(id, { enabled })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Blitz Keys */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              Blitz Keys
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your Blitz API keys for enrichment tools
            </p>
          </div>
          <AddKeyDialog
            type="blitz"
            onAdd={addBlitzKey}
            trigger={
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Key
              </Button>
            }
          />
        </div>
        
        {blitzKeys.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-semibold text-lg">No Blitz keys</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                Add your Blitz API key to start using enrichment tools
              </p>
              <AddKeyDialog
                type="blitz"
                onAdd={addBlitzKey}
                trigger={
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Key
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {blitzKeys.map(key => (
              <KeyCard
                key={key.id}
                keyData={key}
                type="blitz"
                onEdit={(id, label) => updateBlitzKey(id, { label })}
                onDelete={deleteBlitzKey}
                onToggle={(id, enabled) => updateBlitzKey(id, { enabled })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Key Selection Strategy */}
      <Card>
        <CardHeader>
          <CardTitle>Key Selection Strategy</CardTitle>
          <CardDescription>
            How keys are selected when running tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div>
              <p className="font-medium">Auto Rotate</p>
              <p className="text-sm text-muted-foreground">
                Automatically rotate between enabled keys to balance usage
              </p>
            </div>
            <Badge className="gradient-koldify text-white">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div>
              <p className="font-medium">Prefer Healthiest</p>
              <p className="text-sm text-muted-foreground">
                Always use the key with the best health status
              </p>
            </div>
            <Badge variant="outline">Inactive</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
