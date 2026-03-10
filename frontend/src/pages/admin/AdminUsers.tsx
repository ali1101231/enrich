import { useState } from 'react';
import {
  Search,
  MoreVertical,
  Key,
  X,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { useAdmin } from '@/contexts/AdminContext';
import { formatDistanceToNow } from 'date-fns';
import type { AdminUserItem } from '@/lib/api';

export default function AdminUsers() {
  const {
    users,
    keys,
    assignments,
    manualAssign,
    deactivateAssignment,
    deactivateUserAssignments,
  } = useAdmin();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      (user.displayName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const getUserAssignments = (userId: string) =>
    assignments.filter(a => a.userId === userId && a.isActive);

  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and key assignments</p>
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
      </div>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userAssignments = getUserAssignments(user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.displayName ?? user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                      )}>
                        {user.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {userAssignments.length} key{userAssignments.length !== 1 ? 's' : ''}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
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
                          {userAssignments.length > 0 && (
                            <DropdownMenuItem
                              onClick={() => deactivateUserAssignments(user.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove All Keys
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

      {/* Keys Assignment Dialog */}
      <Dialog open={keysDialogOpen} onOpenChange={setKeysDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Keys</DialogTitle>
            <DialogDescription>
              Assign or remove API keys for {selectedUser?.displayName ?? selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {keys.map((key) => {
              const assignment = selectedUser
                ? assignments.find(a => a.userId === selectedUser.id && a.apiKeyId === key.id && a.isActive)
                : undefined;
              const isAssigned = !!assignment;
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-medium">{key.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {key.activeUsers}/{key.maxUsers} users
                    </p>
                  </div>
                  <Button
                    variant={isAssigned ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => {
                      if (selectedUser) {
                        if (isAssigned && assignment) {
                          deactivateAssignment(assignment.id);
                        } else {
                          manualAssign(selectedUser.id, key.id);
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
