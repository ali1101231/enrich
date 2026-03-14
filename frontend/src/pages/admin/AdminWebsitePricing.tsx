import { useMemo, useState, type Dispatch, type SetStateAction, type ElementType } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  BadgeDollarSign,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  Sparkles,
  Star,
  Trash2,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  useAdminWebsitePricingPlans,
  useAdminCreateWebsitePricingPlan,
  useAdminUpdateWebsitePricingPlan,
  useAdminDeleteWebsitePricingPlan,
  useAdminCreateWebsitePricingFeature,
  useAdminUpdateWebsitePricingFeature,
  useAdminDeleteWebsitePricingFeature,
} from '@/hooks/useApi';
import type { AdminWebsitePricingFeatureItem, AdminWebsitePricingPlanItem } from '@/lib/api';

interface PlanFormState {
  name: string;
  subtitle: string;
  price: string;
  billingPeriod: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: string;
}

interface FeatureFormState {
  text: string;
  isIncluded: boolean;
  sortOrder: string;
}

const emptyPlanForm: PlanFormState = {
  name: '',
  subtitle: '',
  price: '',
  billingPeriod: '',
  description: '',
  ctaText: '',
  ctaHref: '',
  isPopular: false,
  isActive: true,
  sortOrder: '0',
};

const emptyFeatureForm: FeatureFormState = {
  text: '',
  isIncluded: true,
  sortOrder: '0',
};

function toOptionalText(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function parseSortOrder(raw: string, label: string): number {
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return parsed;
}

function parsePlanForm(form: PlanFormState) {
  if (!form.name.trim()) {
    throw new Error('Plan name is required.');
  }
  if (!form.price.trim()) {
    throw new Error('Price is required.');
  }

  return {
    name: form.name.trim(),
    subtitle: toOptionalText(form.subtitle),
    price: form.price.trim(),
    billingPeriod: toOptionalText(form.billingPeriod),
    description: toOptionalText(form.description),
    ctaText: toOptionalText(form.ctaText),
    ctaHref: toOptionalText(form.ctaHref),
    isPopular: form.isPopular,
    isActive: form.isActive,
    sortOrder: parseSortOrder(form.sortOrder, 'Sort order'),
  };
}

function parseFeatureForm(form: FeatureFormState) {
  if (!form.text.trim()) {
    throw new Error('Feature text is required.');
  }

  return {
    text: form.text.trim(),
    isIncluded: form.isIncluded,
    sortOrder: parseSortOrder(form.sortOrder, 'Feature sort order'),
  };
}

export default function AdminWebsitePricing() {
  const { toast } = useToast();

  const { data: plans, isLoading } = useAdminWebsitePricingPlans();
  const createPlanMutation = useAdminCreateWebsitePricingPlan();
  const updatePlanMutation = useAdminUpdateWebsitePricingPlan();
  const deletePlanMutation = useAdminDeleteWebsitePricingPlan();
  const createFeatureMutation = useAdminCreateWebsitePricingFeature();
  const updateFeatureMutation = useAdminUpdateWebsitePricingFeature();
  const deleteFeatureMutation = useAdminDeleteWebsitePricingFeature();

  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<AdminWebsitePricingPlanItem | null>(null);
  const [deletePlan, setDeletePlan] = useState<AdminWebsitePricingPlanItem | null>(null);

  const [createForm, setCreateForm] = useState<PlanFormState>({ ...emptyPlanForm });
  const [editForm, setEditForm] = useState<PlanFormState>({ ...emptyPlanForm });

  const [sortDrafts, setSortDrafts] = useState<Record<string, string>>({});
  const [sortingPlanId, setSortingPlanId] = useState<string | null>(null);
  const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

  const [featureCreatePlan, setFeatureCreatePlan] = useState<AdminWebsitePricingPlanItem | null>(null);
  const [featureEdit, setFeatureEdit] = useState<{ feature: AdminWebsitePricingFeatureItem; plan: AdminWebsitePricingPlanItem } | null>(null);
  const [featureDelete, setFeatureDelete] = useState<{ feature: AdminWebsitePricingFeatureItem; plan: AdminWebsitePricingPlanItem } | null>(null);
  const [featureForm, setFeatureForm] = useState<FeatureFormState>({ ...emptyFeatureForm });

  const summary = useMemo(() => {
    const total = plans?.length ?? 0;
    const active = plans?.filter((plan) => plan.isActive).length ?? 0;
    const popular = plans?.filter((plan) => plan.isPopular).length ?? 0;
    const totalFeatures = plans?.reduce((acc, plan) => acc + plan.features.length, 0) ?? 0;
    return { total, active, popular, totalFeatures };
  }, [plans]);

  const resetCreateForm = () => setCreateForm({ ...emptyPlanForm });

  const openEditPlan = (plan: AdminWebsitePricingPlanItem) => {
    setEditPlan(plan);
    setEditForm({
      name: plan.name,
      subtitle: plan.subtitle ?? '',
      price: plan.price,
      billingPeriod: plan.billingPeriod ?? '',
      description: plan.description ?? '',
      ctaText: plan.ctaText ?? '',
      ctaHref: plan.ctaHref ?? '',
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: String(plan.sortOrder),
    });
  };

  const openCreateFeature = (plan: AdminWebsitePricingPlanItem) => {
    setFeatureCreatePlan(plan);
    setFeatureForm({ ...emptyFeatureForm, sortOrder: String(plan.features.length) });
  };

  const openEditFeature = (plan: AdminWebsitePricingPlanItem, feature: AdminWebsitePricingFeatureItem) => {
    setFeatureEdit({ feature, plan });
    setFeatureForm({
      text: feature.text,
      isIncluded: feature.isIncluded,
      sortOrder: String(feature.sortOrder),
    });
  };

  const handleCreatePlan = async () => {
    try {
      await createPlanMutation.mutateAsync(parsePlanForm(createForm));
      toast({ title: 'Pricing plan created' });
      resetCreateForm();
      setCreateOpen(false);
    } catch (error) {
      toast({
        title: 'Create failed',
        description: error instanceof Error ? error.message : 'Failed to create plan.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!editPlan) return;

    try {
      await updatePlanMutation.mutateAsync({
        planId: editPlan.id,
        data: parsePlanForm(editForm),
      });
      toast({ title: 'Pricing plan updated' });
      setEditPlan(null);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update plan.',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlan = async () => {
    if (!deletePlan) return;

    try {
      await deletePlanMutation.mutateAsync(deletePlan.id);
      toast({ title: 'Pricing plan deleted' });
      setDeletePlan(null);
    } catch {
      toast({ title: 'Failed to delete plan', variant: 'destructive' });
    }
  };

  const handleTogglePlanField = async (
    plan: AdminWebsitePricingPlanItem,
    field: 'isActive' | 'isPopular',
  ) => {
    setTogglingPlanId(plan.id);
    try {
      await updatePlanMutation.mutateAsync({
        planId: plan.id,
        data: { [field]: !plan[field] },
      });
      toast({
        title:
          field === 'isActive'
            ? plan.isActive
              ? 'Plan deactivated'
              : 'Plan activated'
            : plan.isPopular
              ? 'Plan unmarked as popular'
              : 'Plan marked as popular',
      });
    } catch {
      toast({ title: 'Failed to update plan', variant: 'destructive' });
    } finally {
      setTogglingPlanId(null);
    }
  };

  const handleSaveSortOrder = async (plan: AdminWebsitePricingPlanItem) => {
    const nextSortRaw = sortDrafts[plan.id] ?? String(plan.sortOrder);
    let nextSort = plan.sortOrder;

    try {
      nextSort = parseSortOrder(nextSortRaw, 'Sort order');
    } catch (error) {
      toast({
        title: 'Invalid sort order',
        description: error instanceof Error ? error.message : 'Sort order is invalid.',
        variant: 'destructive',
      });
      return;
    }

    if (nextSort === plan.sortOrder) return;

    setSortingPlanId(plan.id);
    try {
      await updatePlanMutation.mutateAsync({
        planId: plan.id,
        data: { sortOrder: nextSort },
      });
      toast({ title: 'Sort order updated' });
    } catch {
      toast({ title: 'Failed to update sort order', variant: 'destructive' });
    } finally {
      setSortingPlanId(null);
    }
  };

  const handleCreateFeature = async () => {
    if (!featureCreatePlan) return;

    try {
      await createFeatureMutation.mutateAsync({
        planId: featureCreatePlan.id,
        data: parseFeatureForm(featureForm),
      });
      toast({ title: 'Feature created' });
      setFeatureCreatePlan(null);
      setFeatureForm({ ...emptyFeatureForm });
    } catch (error) {
      toast({
        title: 'Create feature failed',
        description: error instanceof Error ? error.message : 'Failed to create feature.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateFeature = async () => {
    if (!featureEdit) return;

    try {
      await updateFeatureMutation.mutateAsync({
        featureId: featureEdit.feature.id,
        data: parseFeatureForm(featureForm),
      });
      toast({ title: 'Feature updated' });
      setFeatureEdit(null);
      setFeatureForm({ ...emptyFeatureForm });
    } catch (error) {
      toast({
        title: 'Update feature failed',
        description: error instanceof Error ? error.message : 'Failed to update feature.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFeature = async () => {
    if (!featureDelete) return;

    try {
      await deleteFeatureMutation.mutateAsync(featureDelete.feature.id);
      toast({ title: 'Feature deleted' });
      setFeatureDelete(null);
    } catch {
      toast({ title: 'Failed to delete feature', variant: 'destructive' });
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6 lg:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Website Pricing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage website pricing plans, CTA content, visibility, and plan features.
          </p>
        </div>

        <Dialog
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Pricing Plan</DialogTitle>
              <DialogDescription>
                Add a new website pricing plan with CTA, status and display order.
              </DialogDescription>
            </DialogHeader>
            <PlanFormFields form={createForm} setForm={setCreateForm} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePlan} disabled={createPlanMutation.isPending}>
                {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard title="Total Plans" value={summary.total} icon={BadgeDollarSign} />
        <SummaryCard title="Active" value={summary.active} icon={Power} iconClassName="text-green-600" iconBgClassName="bg-green-500/10" />
        <SummaryCard title="Popular" value={summary.popular} icon={Star} iconClassName="text-amber-500" iconBgClassName="bg-amber-500/10" />
        <SummaryCard title="Features" value={summary.totalFeatures} icon={Sparkles} />
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">Loading pricing plans...</CardContent>
        </Card>
      ) : !plans || plans.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <BadgeDollarSign className="h-10 w-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="font-medium">No pricing plans yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first plan to populate website pricing.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <Badge variant={plan.isActive ? 'default' : 'secondary'} className={cn(plan.isActive && 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20')}>
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {plan.isPopular && (
                        <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20">
                          Popular
                        </Badge>
                      )}
                    </div>
                    {plan.subtitle && <CardDescription>{plan.subtitle}</CardDescription>}
                    <p className="text-sm font-medium">
                      {plan.price}
                      {plan.billingPeriod ? <span className="text-muted-foreground font-normal"> / {plan.billingPeriod}</span> : null}
                    </p>
                    {plan.description ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{plan.description}</p>
                    ) : null}
                    {(plan.ctaText || plan.ctaHref) && (
                      <p className="text-xs text-muted-foreground">
                        CTA: {plan.ctaText || '—'}
                        {plan.ctaHref ? ` (${plan.ctaHref})` : ''}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(plan.updatedAt), { addSuffix: true })}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditPlan(plan)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Plan
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openCreateFeature(plan)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Feature
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeletePlan(plan)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePlanField(plan, 'isActive')}
                    disabled={updatePlanMutation.isPending && togglingPlanId === plan.id}
                  >
                    {updatePlanMutation.isPending && togglingPlanId === plan.id
                      ? 'Saving...'
                      : plan.isActive
                        ? 'Deactivate'
                        : 'Activate'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTogglePlanField(plan, 'isPopular')}
                    disabled={updatePlanMutation.isPending && togglingPlanId === plan.id}
                  >
                    {updatePlanMutation.isPending && togglingPlanId === plan.id
                      ? 'Saving...'
                      : plan.isPopular
                        ? 'Unmark Popular'
                        : 'Mark Popular'}
                  </Button>

                  <div className="flex items-center gap-2 ml-auto">
                    <Label className="text-xs text-muted-foreground">Sort</Label>
                    <Input
                      className="h-8 w-20"
                      type="number"
                      min={0}
                      value={sortDrafts[plan.id] ?? String(plan.sortOrder)}
                      onChange={(event) =>
                        setSortDrafts((prev) => ({
                          ...prev,
                          [plan.id]: event.target.value,
                        }))
                      }
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleSaveSortOrder(plan)}
                      disabled={updatePlanMutation.isPending && sortingPlanId === plan.id}
                    >
                      {updatePlanMutation.isPending && sortingPlanId === plan.id ? 'Saving...' : 'Save'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Plan Features</p>
                    <Button variant="ghost" size="sm" onClick={() => openCreateFeature(plan)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add feature
                    </Button>
                  </div>

                  {plan.features.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                      No features yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {plan.features.map((feature) => (
                        <div key={feature.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                          <div className="flex items-center gap-2 min-w-0">
                            {feature.isIncluded ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            )}
                            <p className="text-sm truncate">{feature.text}</p>
                            <Badge variant="outline" className="ml-1">#{feature.sortOrder}</Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditFeature(plan, feature)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setFeatureDelete({ feature, plan })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editPlan} onOpenChange={(open) => { if (!open) setEditPlan(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Pricing Plan</DialogTitle>
            <DialogDescription>
              Update the plan fields. Changes will be reflected in website pricing content.
            </DialogDescription>
          </DialogHeader>
          <PlanFormFields form={editForm} setForm={setEditForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditPlan(null)}>Cancel</Button>
            <Button onClick={handleUpdatePlan} disabled={updatePlanMutation.isPending}>
              {updatePlanMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!featureCreatePlan}
        onOpenChange={(open) => {
          if (!open) {
            setFeatureCreatePlan(null);
            setFeatureForm({ ...emptyFeatureForm });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Feature</DialogTitle>
            <DialogDescription>
              Add a new feature to {featureCreatePlan?.name ?? 'this plan'}.
            </DialogDescription>
          </DialogHeader>
          <FeatureFormFields form={featureForm} setForm={setFeatureForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureCreatePlan(null)}>Cancel</Button>
            <Button onClick={handleCreateFeature} disabled={createFeatureMutation.isPending}>
              {createFeatureMutation.isPending ? 'Creating...' : 'Create Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!featureEdit}
        onOpenChange={(open) => {
          if (!open) {
            setFeatureEdit(null);
            setFeatureForm({ ...emptyFeatureForm });
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Feature</DialogTitle>
            <DialogDescription>
              Update feature copy and display settings.
            </DialogDescription>
          </DialogHeader>
          <FeatureFormFields form={featureForm} setForm={setFeatureForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeatureEdit(null)}>Cancel</Button>
            <Button onClick={handleUpdateFeature} disabled={updateFeatureMutation.isPending}>
              {updateFeatureMutation.isPending ? 'Saving...' : 'Save Feature'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletePlan} onOpenChange={(open) => { if (!open) setDeletePlan(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Pricing Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletePlan?.name ? `"${deletePlan.name}"` : 'this plan'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlanMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!featureDelete} onOpenChange={(open) => { if (!open) setFeatureDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feature</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this feature from {featureDelete?.plan.name ?? 'the plan'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeature}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteFeatureMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PlanFormFields({
  form,
  setForm,
}: {
  form: PlanFormState;
  setForm: Dispatch<SetStateAction<PlanFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            placeholder="e.g. Starter"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input
            placeholder="e.g. Best for solo founders"
            value={form.subtitle}
            onChange={(event) => setForm((current) => ({ ...current, subtitle: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Price</Label>
          <Input
            placeholder="e.g. $29"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>Billing Period</Label>
          <Input
            placeholder="e.g. per month"
            value={form.billingPeriod}
            onChange={(event) => setForm((current) => ({ ...current, billingPeriod: event.target.value }))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          rows={4}
          placeholder="Describe this pricing plan..."
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>CTA Text</Label>
          <Input
            placeholder="e.g. Start Free Trial"
            value={form.ctaText}
            onChange={(event) => setForm((current) => ({ ...current, ctaText: event.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>CTA Href</Label>
          <Input
            placeholder="e.g. /signup"
            value={form.ctaHref}
            onChange={(event) => setForm((current) => ({ ...current, ctaHref: event.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
          />
        </div>
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isActive}
              onCheckedChange={(next) => setForm((current) => ({ ...current, isActive: next }))}
            />
            <Label>Active</Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              checked={form.isPopular}
              onCheckedChange={(next) => setForm((current) => ({ ...current, isPopular: next }))}
            />
            <Label>Popular</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureFormFields({
  form,
  setForm,
}: {
  form: FeatureFormState;
  setForm: Dispatch<SetStateAction<FeatureFormState>>;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label>Feature Text</Label>
        <Textarea
          rows={3}
          placeholder="e.g. Unlimited enrichment rows"
          value={form.text}
          onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Sort Order</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
          />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Switch
            checked={form.isIncluded}
            onCheckedChange={(next) => setForm((current) => ({ ...current, isIncluded: next }))}
          />
          <Label>Included</Label>
        </div>
      </div>
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
