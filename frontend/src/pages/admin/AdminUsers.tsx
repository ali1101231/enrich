import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  MoreVertical,
  Key,
  X,
  Plus,
  Shield,
  ShieldOff,
  Trash2,
  Eye,
  Coins,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdmin } from '@/contexts/AdminContext';
import { useAdminUpdateUserRole, useAdminDeleteUser } from '@/hooks/useApi';
import { formatDistanceToNow } from 'date-fns';
import type { AdminUserItem } from '@/lib/api';

export default function AdminUsers() {
  const navigate = useNavigate();
  const {
    users,
    keys,
    assignments,
    manualAssign,
    deactivateAssignment,
    deactivateUserAssignments,
  } = useAdmin();

  const updateRoleMut = useAdminUpdateUserRole();
  const deleteUserMut = useAdminDeleteUser();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserItem | null>(null);

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
                <TableHead>Credits</TableHead>
                <TableHead>Keys</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => {
                const userAssignments = getUserAssignments(user.id);

                return (
                  <TableRow key={user.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/users/${user.id}`)}>
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
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-sm font-medium">{user.credits.toLocaleString()}</span>
                      </div>
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
                          <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/admin/users/${user.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(user);
                              setKeysDialogOpen(true);
                            }}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Manage Keys
                          </DropdownMenuItem>
                          {user.role === "user" ? (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRoleMut.mutate({ userId: user.id, role: "admin" });
                              }}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRoleMut.mutate({ userId: user.id, role: "user" });
                              }}
                            >
                              <ShieldOff className="h-4 w-4 mr-2" />
                              Remove Admin
                            </DropdownMenuItem>
                          )}
                          {userAssignments.length > 0 && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                deactivateUserAssignments(user.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove All Keys
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(user);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
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

      {/* Delete User Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{deleteTarget?.displayName ?? deleteTarget?.email}</span> and all their data (batches, jobs, exports). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTarget) {
                  deleteUserMut.mutate(deleteTarget.id);
                  setDeleteTarget(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
