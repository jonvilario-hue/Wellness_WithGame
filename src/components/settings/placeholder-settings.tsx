
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface PlaceholderSettingsProps {
    title: string;
    description: string;
}

export function PlaceholderSettings({ title, description }: PlaceholderSettingsProps) {
    return (
        <div className="flex items-center justify-center text-center text-muted-foreground p-8 bg-muted/50 rounded-lg">
            <div className="space-y-2">
                <Info className="mx-auto h-8 w-8" />
                <p className="font-semibold">{title}</p>
                <p className="text-sm">{description}</p>
            </div>
        </div>
    );
}
