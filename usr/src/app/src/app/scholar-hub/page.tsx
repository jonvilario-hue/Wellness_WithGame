'use client';

import { Header } from '@/components/header';
import { PageNav } from '@/components/page-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

const pageTitle = "Scholar Hub";
const pageDescription = "This feature has been restored. Functionality can be rebuilt here.";

export default function PlaceholderPage() {
    return (
        <>
            <div className="sticky top-0 z-20">
                <Header />
                <PageNav />
            </div>
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="mx-auto max-w-5xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>{pageTitle}</CardTitle>
                            <CardDescription>{pageDescription}</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="flex items-center justify-center text-center text-muted-foreground p-8 bg-muted/50 rounded-lg h-64">
                                <div className="space-y-2">
                                    <Info className="mx-auto h-8 w-8" />
                                    <p className="font-semibold">Feature Placeholder</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
