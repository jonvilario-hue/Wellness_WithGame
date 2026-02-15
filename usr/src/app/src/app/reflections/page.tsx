'use client';

import { Header } from '@/components/header';
import { PageNav } from '@/components/page-nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export default function ReflectionsPage() {
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
                            <CardTitle>Reflections</CardTitle>
                            <CardDescription>A space to clear your mind, set intentions, and reflect on your progress.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea placeholder="What's on your mind today?" rows={10} />
                            <Button>Save Entry</Button>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
}
