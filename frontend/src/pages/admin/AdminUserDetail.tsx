import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Shield,
  ShieldOff,
  Trash2,
  Key,
  Plus,
  X,
  Activity,
  FileText,
  BarChart3,
  Mail,
  Calendar,
  User as UserIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  useAdminUserDetail,
  useAdminUpdateUserRole,
  useAdminDeleteUser,
  useAdminKeys,
  useAdminManualAssign,
  useAdminDeactivateAssignment,
} from '@/hooks/useApi';
import { formatDistanceToNow, format } from 'date-fns';

const statusColors: Record<string, string> = {
  COMPLETED: 'bg-success/10 text-success',
  RUNNING: 'bg-blue-500/10 text-blue-500',
  QUEUED: 'bg-yellow-500/10 text-yellow-500',
  FAILED: 'bg-destructive/10 text-destructive',
  PARTIAL: 'bg-orange-500/10 text-orange-500',
};

export default function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminUserDetail(userId);
  const { data: allKeys = [] } = useAdminKeys();
  const updateRoleMut = useAdminUpdateUserRole();
  const deleteUserMut = useAdminDeleteUser();
  const manualAssignMut = useAdminManualAssign();
  const deactivateAssignmentMut = useAdminDeactivateAssignment();

  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-muted-foreground">Loading user details...</div>
      </div>
    );
  }

  const { user, stats, assignments, recentBatches } = data;

  const assignedKeyIds = new Set(assignments.map(a => a.apiKeyId));
  const availableKeys = allKeys.filter(k => !assignedKeyIds.has(k.id) && k.isActive);

  return (
    <div className="p-6 lg:p-8 animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{user.displayName ?? user.email}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="capitalize text-sm px-3 py-1">
            {user.role}
          </Badge>
          <Badge className={cn(
            'text-sm px-3 py-1',
            user.isActive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setKeysDialogOpen(true)}>
          <Key className="h-4 w-4 mr-2" />
          Manage Keys
        </Button>
        {user.role === 'user' ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateRoleMut.mutate({ userId: user.id, role: 'admin' })}
            disabled={updateRoleMut.isPending}
          >
            <Shield className="h-4 w-4 mr-2" />
            Make Admin
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => updateRoleMut.mutate({ userId: user.id, role: 'user' })}
            disabled={updateRoleMut.isPending}
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Remove Admin
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={() => setDeleteDialogOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" />
              Total Runs
            </div>
            <p className="text-2xl font-bold">{stats.totalBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Completed
            </div>
            <p className="text-2xl font-bold text-success">{stats.completedBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Activity className="h-3.5 w-3.5" />
              Active
            </div>
            <p className="text-2xl font-bold text-blue-500">{stats.activeBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <X className="h-3.5 w-3.5" />
              Failed
            </div>
            <p className="text-2xl font-bold text-destructive">{stats.failedBatches}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="h-3.5 w-3.5" />
              Rows Processed
            </div>
            <p className="text-2xl font-bold">{stats.totalRowsProcessed.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="h-3.5 w-3.5" />
              Exports
            </div>
            <p className="text-2xl font-bold">{stats.totalExports}</p>
          </CardContent>
        </Card>
      </div>

      {/* User Info + Assigned Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              User Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-3.5 w-3.5" /> Email
              </span>
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-3.5 w-3.5" /> Display Name
              </span>
              <span className="text-sm font-medium">{user.displayName ?? '—'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-3.5 w-3.5" /> Role
              </span>
              <Badge variant="outline" className="capitalize">{user.role}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" /> Joined
              </span>
              <span className="text-sm font-medium">{format(new Date(user.createdAt), 'PPP')}</span>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Keys */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="h-4 w-4" />
              Assigned Keys ({assignments.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setKeysDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Key
            </Button>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No keys assigned to this user
              </p>
            ) : (
              <div className="space-y-3">
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{assignment.apiKey.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.apiKey.requestsPerSecond} RPS •{' '}
                        {assignment.isManual ? 'Manual' : 'Auto'} •{' '}
                        <Badge
                          variant="secondary"
                          className={cn(
                            'text-[10px] ml-1',
                            assignment.apiKey.isActive ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {assignment.apiKey.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deactivateAssignmentMut.mutate(assignment.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Runs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentBatches.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              This user has no runs yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBatches.map(batch => (
                  <TableRow
                    key={batch.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/admin/activity/${batch.id}`)}
                  >
                    <TableCell className="text-sm font-medium">
                      {batch.toolId ?? 'Unknown'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs capitalize">
                        {batch.sourceType.replace(/_/g, ' ').toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {batch.originalFileName ?? '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {batch.totalRows.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('text-xs', statusColors[batch.status] ?? '')}>
                        {batch.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(batch.createdAt), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manage Keys Dialog */}
      <Dialog open={keysDialogOpen} onOpenChange={setKeysDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Keys</DialogTitle>
            <DialogDescription>
              Assign or remove API keys for {user.displayName ?? user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Currently assigned */}
            {assignments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">ASSIGNED</p>
                {assignments.map(assignment => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between p-3 rounded-lg border mb-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{assignment.apiKey.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {assignment.apiKey.requestsPerSecond} RPS
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deactivateAssignmentMut.mutate(assignment.id)}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {/* Available to assign */}
            {availableKeys.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">AVAILABLE</p>
                {availableKeys.map(key => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-3 rounded-lg border mb-2"
                  >
                    <div>
                      <p className="font-medium text-sm">{key.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {key.activeUsers}/{key.maxUsers} users • {key.requestsPerSecond} RPS
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => manualAssignMut.mutate({ userId: user.id, apiKeyId: key.id })}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Assign
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {assignments.length === 0 && availableKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No keys available. Add keys in the Keys section first.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setKeysDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold">{user.displayName ?? user.email}</span> and all their data (batches, jobs, exports). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteUserMut.mutate(user.id, {
                  onSuccess: () => navigate('/admin/users'),
                });
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
