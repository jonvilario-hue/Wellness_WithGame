'use client';

import { Sliders, ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrainingSettings } from '@/components/settings/training-settings';
import { AppearanceSettings } from '@/components/settings/appearance-settings';
import { Header } from '@/components/header';
import { MotivationalMessage } from '@/components/motivational-message';
import { Button } from '@/components/ui/button';

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
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    <Tabs defaultValue={tab} orientation="vertical" className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <TabsList className="flex flex-col h-auto justify-start items-stretch p-2 space-y-1 bg-muted/50 rounded-lg w-full">
                            <TabsTrigger value="training" className="justify-start gap-2">
                            <Sliders className="h-4 w-4"/> Game Trainer
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="justify-start gap-2">
                            <Sliders className="h-4 w-4"/> Appearance
                            </TabsTrigger>
                        </TabsList>

                        <div className="col-span-1 md:col-span-3">
                            <TabsContent value="training">
                            <TrainingSettings />
                            </TabsContent>
                            <TabsContent value="appearance">
                            <AppearanceSettings />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </main>
        </>
      );
}
