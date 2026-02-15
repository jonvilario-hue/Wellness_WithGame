
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme } from '@/hooks/use-theme';
import { themes } from '@/data/themes';
import { Check, Leaf, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { useMotivationStore } from '@/hooks/use-motivation-store';

export function AppearanceSettings() {
  const { theme: activeTheme, setTheme, organicGrowth, setOrganicGrowth } = useTheme();
  const { notificationsEnabled, toggleNotifications } = useMotivationStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
        <CardDescription>
          Customize the look and feel of the app. Select a theme that best suits your training style.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <Label className="text-base font-semibold">Color Theme</Label>
            <p className="text-sm text-muted-foreground mb-4">Select a theme that best suits your training environment.</p>
            <TooltipProvider>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {themes.map((theme) => {
                    const isActive = activeTheme.key === theme.key;
                    const Icon = theme.icon;
                    return (
                    <Tooltip key={theme.key} delayDuration={100}>
                        <TooltipTrigger asChild>
                            <div
                                onClick={() => setTheme(theme)}
                                className={cn(
                                    'rounded-lg border-2 p-4 cursor-pointer transition-all relative flex flex-col',
                                    isActive ? 'border-primary shadow-lg' : 'border-muted hover:border-muted-foreground/50'
                                )}
                                style={{ 
                                    backgroundColor: `hsl(${theme.colorScheme.panels})`,
                                    borderColor: isActive ? `hsl(${theme.colorScheme.accent})` : undefined
                                }}
                            >
                                {isActive && (
                                    <div className="absolute top-2 right-2 p-1 rounded-full text-primary-foreground" style={{ backgroundColor: `hsl(${theme.colorScheme.accent})` }}>
                                        <Check className="h-4 w-4" />
                                    </div>
                                )}
                                <div className="flex flex-col h-full flex-grow">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-2 rounded-md" style={{ backgroundColor: `hsl(${theme.colorScheme.panels})`, color: `hsl(${theme.colorScheme.accent})` }}>
                                            <Icon className="w-5 h-5"/>
                                        </div>
                                        <h3 className="font-bold text-lg" style={{ color: `hsl(${theme.colorScheme.textPrimary})` }}>
                                            {theme.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm flex-grow" style={{ color: `hsl(${theme.colorScheme.textSecondary})` }}>
                                        {theme.idealFor}
                                    </p>
                                </div>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p className="font-bold">{theme.name}</p>
                            <p className="text-sm max-w-xs">{theme.scientificRationale}</p>
                        </TooltipContent>
                    </Tooltip>
                    );
                })}
                </div>
            </TooltipProvider>
        </div>

        <Separator />

        <div>
            <Label className="text-base font-semibold">UI Elements</Label>
            <p className="text-sm text-muted-foreground mb-4">Toggle decorative or ambient UI elements.</p>
            <div className="space-y-2">
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label htmlFor="organic-growth-switch" className="flex items-center gap-3 font-medium">
                        <Leaf className="w-5 h-5 text-primary" />
                        <div>
                            Enable Organic Growth
                            <p className="text-xs text-muted-foreground font-normal">Show plant-like visuals that grow with your progress.</p>
                        </div>
                    </Label>
                    <Switch
                        id="organic-growth-switch"
                        checked={organicGrowth}
                        onCheckedChange={setOrganicGrowth}
                    />
                </div>
                 <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <Label htmlFor="motivational-messages-switch" className="flex items-center gap-3 font-medium">
                        <MessageSquare className="w-5 h-5 text-primary" />
                        <div>
                            Show Motivational Messages
                            <p className="text-xs text-muted-foreground font-normal">Display personalized, supportive messages based on your activity.</p>
                        </div>
                    </Label>
                    <Switch
                        id="motivational-messages-switch"
                        checked={notificationsEnabled}
                        onCheckedChange={toggleNotifications}
                    />
                </div>
            </div>
        </div>

      </CardContent>
    </Card>
  );
}
