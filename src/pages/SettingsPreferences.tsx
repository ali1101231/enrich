import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor, Bell, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPreferences() {
  const { preferences, updatePreferences } = useApp();

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="space-y-8">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.theme}
            onValueChange={(value) => {
              updatePreferences({ theme: value as 'light' | 'dark' | 'system' });
              if (value === 'dark') {
                document.documentElement.classList.add('dark');
              } else if (value === 'light') {
                document.documentElement.classList.remove('dark');
              } else {
                // System preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                document.documentElement.classList.toggle('dark', prefersDark);
              }
            }}
            className="grid grid-cols-3 gap-4"
          >
            {themes.map((theme) => (
              <Label
                key={theme.value}
                htmlFor={theme.value}
                className={cn(
                  'flex flex-col items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                  preferences.theme === theme.value
                    ? 'border-primary bg-primary/5'
                    : 'border-muted hover:border-muted-foreground/30'
                )}
              >
                <RadioGroupItem value={theme.value} id={theme.value} className="sr-only" />
                <theme.icon className="h-6 w-6" />
                <span className="font-medium">{theme.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Run Completed</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a run finishes successfully
              </p>
            </div>
            <Switch
              checked={preferences.notifications.runCompleted}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { ...preferences.notifications, runCompleted: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Run Failed</Label>
              <p className="text-sm text-muted-foreground">
                Notify when a run fails or encounters errors
              </p>
            </div>
            <Switch
              checked={preferences.notifications.runFailed}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { ...preferences.notifications, runFailed: checked },
                })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Key Warnings</Label>
              <p className="text-sm text-muted-foreground">
                Notify about API key issues or rate limits
              </p>
            </div>
            <Switch
              checked={preferences.notifications.keyWarnings}
              onCheckedChange={(checked) =>
                updatePreferences({
                  notifications: { ...preferences.notifications, keyWarnings: checked },
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Key Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Key Selection
          </CardTitle>
          <CardDescription>How API keys are selected for runs</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={preferences.defaultKeyStrategy}
            onValueChange={(value) =>
              updatePreferences({ defaultKeyStrategy: value as 'rotate' | 'healthiest' | 'manual' })
            }
            className="space-y-3"
          >
            <Label
              htmlFor="rotate"
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                preferences.defaultKeyStrategy === 'rotate'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value="rotate" id="rotate" />
              <div>
                <p className="font-medium">Auto Rotate</p>
                <p className="text-sm text-muted-foreground">
                  Rotate between enabled keys to balance usage
                </p>
              </div>
            </Label>
            <Label
              htmlFor="healthiest"
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                preferences.defaultKeyStrategy === 'healthiest'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value="healthiest" id="healthiest" />
              <div>
                <p className="font-medium">Prefer Healthiest</p>
                <p className="text-sm text-muted-foreground">
                  Always use the key with the best health status
                </p>
              </div>
            </Label>
            <Label
              htmlFor="manual"
              className={cn(
                'flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors',
                preferences.defaultKeyStrategy === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-muted-foreground/30'
              )}
            >
              <RadioGroupItem value="manual" id="manual" />
              <div>
                <p className="font-medium">Manual Selection</p>
                <p className="text-sm text-muted-foreground">
                  Choose which key to use for each run
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  );
}
