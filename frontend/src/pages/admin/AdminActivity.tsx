import { Activity } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function AdminActivity() {
  return (
    <div className="p-6 lg:p-8 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground">Monitor all user actions and tool runs</p>
      </div>

      <Card>
        <CardContent className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold text-lg">Activity logging coming soon</h3>
          <p className="text-muted-foreground mt-1">
            User activity will be tracked and displayed here in a future update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
