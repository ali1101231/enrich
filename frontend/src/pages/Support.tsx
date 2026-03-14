import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { LifeBuoy, MessageSquare, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateSupportTicket,
  useReplySupportTicket,
  useSupportTickets,
} from '@/hooks/useApi';

export default function Support() {
  const { toast } = useToast();
  const { data: tickets, isLoading } = useSupportTickets();
  const createMutation = useCreateSupportTicket();
  const replyMutation = useReplySupportTicket();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyingTicketId, setReplyingTicketId] = useState<string | null>(null);

  const openCount = tickets?.filter((ticket) => ticket.status === 'OPEN').length ?? 0;

  const handleCreateTicket = async () => {
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedSubject) {
      toast({ title: 'Subject is required', variant: 'destructive' });
      return;
    }
    if (!trimmedMessage) {
      toast({ title: 'Message is required', variant: 'destructive' });
      return;
    }

    try {
      await createMutation.mutateAsync({ subject: trimmedSubject, message: trimmedMessage });
      setSubject('');
      setMessage('');
      toast({ title: 'Ticket created', description: 'Your request has been sent to admin.' });
    } catch (error) {
      toast({
        title: 'Failed to create ticket',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReply = async (ticketId: string) => {
    const draft = (replyDrafts[ticketId] ?? '').trim();
    if (!draft) {
      toast({ title: 'Reply is required', variant: 'destructive' });
      return;
    }

    setReplyingTicketId(ticketId);
    try {
      await replyMutation.mutateAsync({ ticketId, message: draft });
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

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Support</h1>
        </div>
        <p className="text-muted-foreground">
          Create support tickets and chat with the admin team in one place.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="secondary">{tickets?.length ?? 0} ticket{(tickets?.length ?? 0) === 1 ? '' : 's'}</Badge>
          <Badge variant="outline">{openCount} open</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Create Ticket
          </CardTitle>
          <CardDescription>Describe your issue and admin will reply in this thread.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
          <Textarea
            rows={4}
            placeholder="Tell us what you need help with..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleCreateTicket} disabled={createMutation.isPending}>
            {createMutation.isPending ? 'Sending...' : 'Send Ticket'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading tickets...</CardContent>
        </Card>
      ) : !tickets || tickets.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <MessageSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No tickets yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a ticket above to contact admin.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                    <CardDescription className="mt-1">
                      Updated {formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true })}
                    </CardDescription>
                  </div>
                  <Badge variant={ticket.status === 'OPEN' ? 'default' : 'secondary'}>
                    {ticket.status === 'OPEN' ? 'Open' : 'Closed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 rounded-lg border p-3">
                  {ticket.messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No messages yet.</p>
                  ) : (
                    ticket.messages.map((item) => (
                      <div key={item.id} className="rounded-lg border bg-card p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {item.senderRole === 'ADMIN'
                              ? `Admin • ${item.sender.displayName || item.sender.email}`
                              : 'You'}
                          </span>
                          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  {ticket.status === 'CLOSED' && (
                    <p className="text-xs text-muted-foreground">
                      This ticket is closed. Reply to reopen it.
                    </p>
                  )}
                  <Textarea
                    rows={3}
                    placeholder="Write a reply..."
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
