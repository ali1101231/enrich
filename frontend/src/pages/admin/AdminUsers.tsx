import { useState } from 'react';
import {
  Search,
  MoreVertical,
  UserCheck,
  UserX,
  Key,
  CreditCard,
  Mail,
  ChevronDown,
  X,
  Plus,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useAdmin, AdminUser } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
};

const planCredits = {
  starter: 100000,
  business: 200000,
  enterprise: 500000,
};

export default function AdminUsers() {
  const {
    users,
    keys,
    suspendUser,
    activateUser,
    assignKeyToUser,
    removeKeyFromUser,
    setUserCredits,
    updateUser,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [newCredits, setNewCredits] = useState('');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSetCredits = () => {
    if (selectedUser && newCredits) {
      setUserCredits(selectedUser.id, parseInt(newCredits));
      setCreditsDialogOpen(false);
      setNewCredits('');
    }
  };

  const handleChangePlan = (userId: string, plan: 'starter' | 'business' | 'enterprise') => {
    updateUser(userId, { plan, creditsTotal: planCredits[plan] });
  };

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and credits</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const creditPercent = (user.creditsUsed / user.creditsTotal) * 100;
                const userKeys = keys.filter((k) => user.assignedKeyIds.includes(k.id));

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('capitalize', statusColors[user.status])}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={user.plan}
                        onValueChange={(v) => handleChangePlan(user.id, v as any)}
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="starter">Starter</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 min-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                          <span>{(user.creditsUsed / 1000).toFixed(0)}K</span>
                          <span className="text-muted-foreground">
                            / {(user.creditsTotal / 1000).toFixed(0)}K
                          </span>
                        </div>
                        <Progress
                          value={creditPercent}
                          className={cn('h-1.5', creditPercent > 90 && '[&>div]:bg-destructive')}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {userKeys.length > 0 ? (
                          <Badge variant="secondary" className="text-xs">
                            {userKeys.length} key{userKeys.length > 1 ? 's' : ''}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{user.runsTotal}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setKeysDialogOpen(true);
                            }}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Manage Keys
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setNewCredits(user.creditsTotal.toString());
                              setCreditsDialogOpen(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Set Credits
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {user.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => suspendUser(user.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => activateUser(user.id)}>
                              <UserCheck className="h-4 w-4 mr-2" />
                              Activate User
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Credits Dialog */}
      <Dialog open={creditsDialogOpen} onOpenChange={setCreditsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Credits</DialogTitle>
            <DialogDescription>
              Update the total credits for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Total Credits</Label>
              <Input
                type="number"
                value={newCredits}
                onChange={(e) => setNewCredits(e.target.value)}
                placeholder="e.g., 200000"
              />
              <p className="text-xs text-muted-foreground">
                Current usage: {selectedUser?.creditsUsed.toLocaleString()} credits
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSetCredits}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keys Assignment Dialog */}
      <Dialog open={keysDialogOpen} onOpenChange={setKeysDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Keys</DialogTitle>
            <DialogDescription>
              Assign or remove API keys for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {keys.map((key) => {
              const isAssigned = selectedUser?.assignedKeyIds.includes(key.id);
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{key.label}</p>
                    <p className="text-xs text-muted-foreground font-mono">{key.keyMasked}</p>
                  </div>
                  <Button
                    variant={isAssigned ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => {
                      if (selectedUser) {
                        if (isAssigned) {
                          removeKeyFromUser(selectedUser.id, key.id);
                        } else {
                          assignKeyToUser(selectedUser.id, key.id);
                        }
                      }
                    }}
                  >
                    {isAssigned ? (
                      <>
                        <X className="h-4 w-4 mr-1" /> Remove
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" /> Assign
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button onClick={() => setKeysDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
