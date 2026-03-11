import { useState } from 'react';
import { Tag, Coins, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api';
import { useOffers, useAvailOffer } from '@/hooks/useApi';

export default function Offers() {
  const { toast } = useToast();
  const { data: offers, isLoading } = useOffers();
  const availMutation = useAvailOffer();
  const [pendingOfferId, setPendingOfferId] = useState<string | null>(null);

  const handleAvail = async (offerId: string) => {
    setPendingOfferId(offerId);
    try {
      const res = await availMutation.mutateAsync(offerId);
      toast({
        title: 'Offer availed',
        description: `${res.creditsAdded} credits added. New balance: ${res.credits.toLocaleString()} credits.`,
      });
    } catch (error) {
      toast({
        title: 'Unable to avail offer',
        description: error instanceof ApiError ? error.message : 'Something went wrong.',
        variant: 'destructive',
      });
    } finally {
      setPendingOfferId(null);
    }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Offers</h1>
        <p className="text-muted-foreground">
          Avail limited-time offers to add credits to your account.
        </p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading offers...</CardContent>
        </Card>
      ) : !offers || offers.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Tag className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No offers available right now</p>
            <p className="text-sm text-muted-foreground mt-1">Please check back later.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {offers.map((offer) => {
            const disabled = offer.hasRedeemed || offer.isSoldOut || pendingOfferId === offer.id;

            return (
              <Card key={offer.id} className={cn(offer.hasRedeemed && 'border-green-500/30 bg-green-500/5')}>
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg leading-tight">{offer.title}</CardTitle>
                    {offer.hasRedeemed ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Claimed</Badge>
                    ) : offer.isSoldOut ? (
                      <Badge variant="secondary">Sold Out</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </div>
                  <CardDescription className="min-h-[40px]">
                    {offer.description || 'Special credits offer.'}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-amber-500" />
                        Credits
                      </span>
                      <span className="font-semibold">+{offer.credits}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        Avails
                      </span>
                      <span className="font-medium">{offer.redeemedCount} / {offer.maxRedemptions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Remaining</span>
                      <span className="font-medium">{offer.remainingRedemptions}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    variant={offer.hasRedeemed ? 'outline' : 'default'}
                    onClick={() => handleAvail(offer.id)}
                    disabled={disabled}
                  >
                    {pendingOfferId === offer.id
                      ? 'Availing...'
                      : offer.hasRedeemed
                        ? 'Already Availed'
                        : offer.isSoldOut
                          ? 'Sold Out'
                          : 'Avail Offer'}
                  </Button>

                  {offer.hasRedeemed && (
                    <p className="text-xs text-green-600 inline-flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      You have already availed this offer.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
