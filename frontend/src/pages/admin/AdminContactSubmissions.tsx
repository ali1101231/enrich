import { useEffect, useMemo, useState, type ElementType } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Inbox,
  MailOpen,
  Search,
  Trash2,
  UserRound,
  Building2,
  Phone,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useToast } from '@/hooks/use-toast';
import {
  useAdminContactSubmissions,
  useAdminContactSubmission,
  useAdminUpdateContactSubmissionStatus,
  useAdminUpdateContactSubmissionNotes,
  useAdminMarkContactSubmissionReplied,
  useAdminDeleteContactSubmission,
} from '@/hooks/useApi';
import type { ContactSubmissionItem, ContactSubmissionStatus } from '@/lib/api';

type InboxFilter = 'all' | ContactSubmissionStatus;

const statusLabels: Record<ContactSubmissionStatus, string> = {
  new: 'New',
  replied: 'Replied',
  closed: 'Closed',
};

function normalizeStatus(status: string): ContactSubmissionStatus {
  if (status === 'new' || status === 'replied' || status === 'closed') {
    return status;
  }
  return 'new';
}

function statusBadgeClass(status: ContactSubmissionStatus): string {
  if (status === 'new') return 'bg-blue-500/10 text-blue-700 border-blue-500/20 hover:bg-blue-500/20';
  if (status === 'replied') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20';
  return 'bg-slate-500/10 text-slate-700 border-slate-500/20 hover:bg-slate-500/20';
}

export default function AdminContactSubmissions() {
  const { toast } = useToast();

  const { data: submissions, isLoading } = useAdminContactSubmissions();
  const updateStatusMutation = useAdminUpdateContactSubmissionStatus();
  const updateNotesMutation = useAdminUpdateContactSubmissionNotes();
  const markRepliedMutation = useAdminMarkContactSubmissionReplied();
  const deleteMutation = useAdminDeleteContactSubmission();

  const [filter, setFilter] = useState<InboxFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ContactSubmissionItem | null>(null);

  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [markingRepliedId, setMarkingRepliedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return (submissions ?? []).filter((item) => {
      const itemStatus = normalizeStatus((item.status ?? '').toLowerCase());
      const matchesStatus = filter === 'all' ? true : itemStatus === filter;
      const matchesSearch =
        !query ||
        item.fullName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [submissions, filter, search]);

  const counts = useMemo(() => {
    const items = submissions ?? [];
    return {
      all: items.length,
      new: items.filter((item) => normalizeStatus((item.status ?? '').toLowerCase()) === 'new').length,
      replied: items.filter((item) => normalizeStatus((item.status ?? '').toLowerCase()) === 'replied').length,
      closed: items.filter((item) => normalizeStatus((item.status ?? '').toLowerCase()) === 'closed').length,
    };
  }, [submissions]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) {
      setSelectedId(filtered[0].id);
      return;
    }

    if (selectedId && filtered.length > 0 && !filtered.some((item) => item.id === selectedId)) {
      setSelectedId(filtered[0].id);
      return;
    }

    if (filtered.length === 0) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const { data: selectedDetail, isLoading: isLoadingDetail } = useAdminContactSubmission(selectedId ?? undefined);

  const selected = selectedDetail ?? (submissions ?? []).find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    setNotesDraft(selected?.adminNotes ?? '');
  }, [selected?.id, selected?.adminNotes]);

  const handleUpdateStatus = async (status: ContactSubmissionStatus) => {
    if (!selected) return;

    setStatusUpdatingId(selected.id);
    try {
      await updateStatusMutation.mutateAsync({ submissionId: selected.id, status });
      toast({ title: `Status updated to ${statusLabels[status]}` });
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!selected) return;

    setSavingNotesId(selected.id);
    try {
      await updateNotesMutation.mutateAsync({
        submissionId: selected.id,
        adminNotes: notesDraft.trim() ? notesDraft.trim() : null,
      });
      toast({ title: 'Admin notes saved' });
    } catch (error) {
      toast({
        title: 'Failed to save notes',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSavingNotesId(null);
    }
  };

  const handleMarkReplied = async () => {
    if (!selected) return;

    setMarkingRepliedId(selected.id);
    try {
      await markRepliedMutation.mutateAsync(selected.id);
      toast({ title: 'Submission marked as replied' });
    } catch (error) {
      toast({
        title: 'Failed to mark as replied',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setMarkingRepliedId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast({ title: 'Submission deleted' });
      if (selectedId === deleteTarget.id) {
        setSelectedId(null);
      }
      setDeleteTarget(null);
    } catch {
      toast({ title: 'Failed to delete submission', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contact Submissions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage inbound website leads and messages with inbox-style workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard title="Total" value={counts.all} icon={Inbox} />
        <SummaryCard title="New" value={counts.new} icon={CircleDot} iconClassName="text-blue-600" iconBgClassName="bg-blue-500/10" />
        <SummaryCard title="Replied" value={counts.replied} icon={MailOpen} iconClassName="text-emerald-600" iconBgClassName="bg-emerald-500/10" />
        <SummaryCard title="Closed" value={counts.closed} icon={Inbox} iconClassName="text-slate-600" iconBgClassName="bg-slate-500/10" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4 items-start">
        <Card className="xl:sticky xl:top-4">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-base">Inbox</CardTitle>
            <div className="relative">
              <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                className="pl-9"
                placeholder="Search name or email"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterButton label={`All (${counts.all})`} active={filter === 'all'} onClick={() => setFilter('all')} />
              <FilterButton label={`New (${counts.new})`} active={filter === 'new'} onClick={() => setFilter('new')} />
              <FilterButton label={`Replied (${counts.replied})`} active={filter === 'replied'} onClick={() => setFilter('replied')} />
              <FilterButton label={`Closed (${counts.closed})`} active={filter === 'closed'} onClick={() => setFilter('closed')} />
            </div>
          </CardHeader>

          <CardContent className="space-y-2 max-h-[620px] overflow-auto">
            {isLoading ? (
              <p className="text-sm text-muted-foreground py-4">Loading submissions...</p>
            ) : filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No submissions match the current filters.
              </div>
            ) : (
              filtered.map((item) => {
                const itemStatus = normalizeStatus((item.status ?? '').toLowerCase());
                const isSelected = item.id === selectedId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'w-full text-left rounded-lg border p-3 transition-colors',
                      isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{item.fullName}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.email}</p>
                      </div>
                      <Badge className={cn('capitalize', statusBadgeClass(itemStatus))}>
                        {statusLabels[itemStatus]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                      {item.subject || '(No subject)'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.createdAt), 'PPp')}
                    </p>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          {!selected ? (
            <CardContent className="p-12 text-center">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
              <p className="font-medium">Select a submission</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pick an item from the inbox to view and manage lead details.
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-xl">{selected.subject || 'Contact Submission'}</CardTitle>
                    <CardDescription className="mt-1">
                      Received {format(new Date(selected.createdAt), 'PPpp')} ({formatDistanceToNow(new Date(selected.createdAt), { addSuffix: true })})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn('capitalize', statusBadgeClass(normalizeStatus((selected.status ?? '').toLowerCase())))}>
                      {statusLabels[normalizeStatus((selected.status ?? '').toLowerCase())]}
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeleteTarget(selected)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {isLoadingDetail ? (
                  <p className="text-sm text-muted-foreground">Loading full details...</p>
                ) : null}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <DetailItem icon={UserRound} label="Full Name" value={selected.fullName} />
                  <DetailItem icon={MailOpen} label="Email" value={selected.email} />
                  <DetailItem icon={Building2} label="Company" value={selected.company || '—'} />
                  <DetailItem icon={Phone} label="Phone" value={selected.phone || '—'} />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="rounded-lg border p-4 text-sm whitespace-pre-wrap">{selected.message}</div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2">
                    {(['new', 'replied', 'closed'] as ContactSubmissionStatus[]).map((status) => (
                      <Button
                        key={status}
                        variant={normalizeStatus((selected.status ?? '').toLowerCase()) === status ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleUpdateStatus(status)}
                        disabled={updateStatusMutation.isPending && statusUpdatingId === selected.id}
                      >
                        {updateStatusMutation.isPending && statusUpdatingId === selected.id
                          ? 'Updating...'
                          : statusLabels[status]}
                      </Button>
                    ))}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMarkReplied}
                      disabled={markRepliedMutation.isPending && markingRepliedId === selected.id}
                    >
                      {markRepliedMutation.isPending && markingRepliedId === selected.id
                        ? 'Marking...'
                        : 'Mark as Replied'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    rows={5}
                    placeholder="Add private admin notes for follow-up context..."
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveNotes}
                      disabled={updateNotesMutation.isPending && savingNotesId === selected.id}
                    >
                      {updateNotesMutation.isPending && savingNotesId === selected.id
                        ? 'Saving...'
                        : 'Save Notes'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Submission</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this contact submission from {deleteTarget?.fullName ?? 'this lead'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Button variant={active ? 'default' : 'outline'} size="sm" onClick={onClick}>
      {label}
    </Button>
  );
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 font-medium break-words">{value}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClassName,
  iconBgClassName,
}: {
  title: string;
  value: number;
  icon: ElementType;
  iconClassName?: string;
  iconBgClassName?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10', iconBgClassName)}>
            <Icon className={cn('h-5 w-5 text-primary', iconClassName)} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
