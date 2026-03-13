import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LifeBuoy, MessageSquareText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminReplySupportTicket,
  useAdminSupportTickets,
  useAdminUpdateSupportTicketStatus,
} from '@/hooks/useApi';

export default function AdminSupport() {
  const { toast } = useToast();
  const { data: tickets, isLoading } = useAdminSupportTickets();
  const replyMutation = useAdminReplySupportTicket();
  const statusMutation = useAdminUpdateSupportTicketStatus();

  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);
  const [updatingStatusTicketId, setUpdatingStatusTicketId] = useState<string | null>(null);

  const openCount = tickets?.filter((ticket) => ticket.status === 'OPEN').length ?? 0;
  const closedCount = (tickets?.length ?? 0) - openCount;

  const handleReply = async (ticketId: string) => {
    const message = (replyDrafts[ticketId] ?? '').trim();
    if (!message) {
      toast({ title: 'Reply is required', variant: 'destructive' });
      return;
    }

    setReplyingTicketId(ticketId);
    try {
      await replyMutation.mutateAsync({ ticketId, message });
      setReplyDrafts((prev) => ({ ...prev, [ticketId]: '' }));
      toast({ title: 'Reply sent' });
    } catch (error) {
      toast({
        title: 'Failed to send reply',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setReplyingTicketId(null);
    }
  };

  const handleToggleStatus = async (ticketId: string, currentStatus: 'OPEN' | 'CLOSED') => {
    const nextStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';

    setUpdatingStatusTicketId(ticketId);
    try {
      await statusMutation.mutateAsync({ ticketId, status: nextStatus });
      toast({ title: `Ticket ${nextStatus === 'OPEN' ? 'reopened' : 'closed'}` });
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingStatusTicketId(null);
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Review user tickets, reply, and close or reopen conversations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <LifeBuoy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
                <p className="text-2xl font-bold">{tickets?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <MessageSquareText className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{openCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/10">
                <LifeBuoy className="h-5 w-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold">{closedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading tickets...</CardContent>
        </Card>
      ) : !tickets || tickets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <LifeBuoy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No support tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">User tickets will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="space-y-2 pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      {ticket.user.displayName || ticket.user.email} • Updated{' '}
                      {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'}>
                      {ticket.status === 'OPEN' ? 'Open' : 'Closed'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(ticket.id, ticket.status)}
                      disabled={statusMutation.isPending && updatingStatusTicketId === ticket.id}
                    >
                      {statusMutation.isPending && updatingStatusTicketId === ticket.id
                        ? 'Updating...'
                        : ticket.status === 'OPEN'
                          ? 'Close'
                          : 'Reopen'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border p-3">
                  {ticket.messages.map((item) => (
                    <div key={item.id} className="rounded-lg border bg-card p-3">
                      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                        <span>
                          {item.senderRole === 'ADMIN'
                            ? `Admin • ${item.sender.displayName || item.sender.email}`
                            : `User • ${item.sender.displayName || item.sender.email}`}
                        </span>
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder="Write a reply to this user..."
                    value={replyDrafts[ticket.id] ?? ''}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [ticket.id]: e.target.value,
                      }))
                    }
                  />
                  <Button
                    onClick={() => handleReply(ticket.id)}
                    disabled={replyMutation.isPending && replyingTicketId === ticket.id}
                  >
                    {replyMutation.isPending && replyingTicketId === ticket.id ? 'Sending...' : 'Reply'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
