
'use client';

import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardSettings, componentLabels, type DashboardSettings } from '@/hooks/use-dashboard-settings';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from './ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { motion } from 'framer-motion';

interface PageSpecificSettingsProps {
  settingsKeys: (keyof DashboardSettings)[];
}

export function PageSpecificSettings({ settingsKeys }: PageSpecificSettingsProps) {
  const { settings, toggleSetting } = useDashboardSettings();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Popover>
        <PopoverTrigger asChild>
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          >
            <Button
              size="icon"
              className="rounded-full w-14 h-14 shadow-lg"
              aria-label="Toggle Page Settings"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </motion.div>
        </PopoverTrigger>
        <PopoverContent className="w-[400px]" side="top" align="end">
            <Card className="shadow-none border-none">
              <CardHeader>
                <CardTitle>Page Layout</CardTitle>
                <CardDescription>Toggle components on this page.</CardDescription>
              </CardHeader>
              <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {settingsKeys.map((key) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <Label htmlFor={`switch-${key}`} className="font-medium text-xs">
                          {componentLabels[key] || key}
                        </Label>
                        <Switch
                          id={`switch-${key}`}
                          checked={settings[key]}
                          onCheckedChange={() => toggleSetting(key)}
                        />
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>
        </PopoverContent>
      </Popover>
    </div>
  );
}
