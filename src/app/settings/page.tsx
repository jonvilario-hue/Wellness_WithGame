
'use client';

import { Sliders, Palette } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainingSettings } from '@/components/settings/training-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { Header } from '@/components/header';
import { MotivationalMessage } from '@/components/motivational-message';

export default function SettingsPage() {
    const searchParams = useSearchParams();
    const tab = searchParams.get('tab') || 'training';

    return (
        <>
            <div className="sticky top-0 z-20">
                <Header />
            </div>
            <MotivationalMessage />
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="mx-auto max-w-5xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                        <p className="text-muted-foreground">
                            Customize your training experience and app appearance.
                        </p>
                    </div>

                    <Tabs defaultValue={tab} className="space-y-6">
                        <TabsList>
                            <TabsTrigger value="training" className="gap-2">
                                <Sliders className="h-4 w-4"/> Training
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="gap-2">
                                <Palette className="h-4 w-4"/> Appearance
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="training">
                            <TrainingSettings />
                        </TabsContent>
                        <TabsContent value="appearance">
                            <AppearanceSettings />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </>
      );
}
