'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useCallback, useEffect } from "react";
import { useAudioEngine } from "@/hooks/useAudioEngine";
import { Headphones, Music, Waves, Ear, Locate, Brain, Bot } from "lucide-react";
import { domainIcons } from "@/components/icons";
import { PitchDiscriminationModule } from './PitchDiscriminationModule';
import { TimbreModule } from './TimbreModule';
import { LocalizationModule } from './LocalizationModule';
import { Menu } from './Menu';
import { useTrainingFocus } from "@/hooks/use-training-focus";
import { useTrainingOverride } from "@/hooks/use-training-override";

type GaMode = 'pitch' | 'timing' | 'timbre' | 'recall' | 'segregation' | 'localization' | 'prosody';

const modeConfig: Record<GaMode, { title: string, Icon: React.ElementType, Component: React.FC<{ onComplete: () => void }> }> = {
    pitch: { title: "Pitch", Icon: Waves, Component: PitchDiscriminationModule },
    timing: { title: "Timing", Icon: Music, Component: () => <p>Timing Module WIP</p> },
    timbre: { title: "Timbre", Icon: Ear, Component: TimbreModule },
    recall: { title: "Melody Recall", Icon: Brain, Component: () => <p>Melody Recall WIP</p> },
    segregation: { title: "Segregation", Icon: Bot, Component: () => <p>Segregation Module WIP</p> },
    localization: { title: "Localization", Icon: Locate, Component: LocalizationModule },
    prosody: { title: "Prosody", Icon: Headphones, Component: () => <p>Prosody Module WIP</p> },
};

export default function AuditoryProcessingRouter() {
    const [activeMode, setActiveMode] = useState<'menu' | GaMode>('menu');
    const { engine } = useAudioEngine();
    const { focus: globalFocus } = useTrainingFocus();
    const { override } = useTrainingOverride();
    const effectiveFocus = override || globalFocus;

    useEffect(() => {
        // Reset to menu whenever the focus tab changes.
        setActiveMode('menu');
    }, [effectiveFocus]);

    const handleSelectMode = useCallback((mode: string) => {
        engine?.resumeContext();
        setActiveMode(mode as GaMode);
    }, [engine]);

    const handleModeComplete = useCallback(() => {
        setActiveMode('menu');
    }, []);

    const renderActiveMode = () => {
        if (activeMode === 'menu') {
            const modesForMenu = (Object.keys(modeConfig) as GaMode[]).map(key => ({
                key,
                title: modeConfig[key].title,
                Icon: modeConfig[key].Icon,
            }));
            return <Menu onSelectMode={handleSelectMode} modes={modesForMenu} />;
        }
        const { Component } = modeConfig[activeMode];
        return <Component onComplete={handleModeComplete} />;
    };

    return (
        <Card className="w-full max-w-3xl bg-violet-900/80 border-violet-500/30 backdrop-blur-sm text-violet-100">
            <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2 text-violet-300">
                    <span className="p-2 bg-violet-500/10 rounded-md"><domainIcons.Ga className="w-6 h-6 text-violet-400" /></span>
                    Auditory Processing Lab
                </CardTitle>
                <CardDescription className="text-violet-300/70">A rotating lab of exercises to sharpen your brain's ability to analyze and distinguish sounds. Wired headphones recommended for best results.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-6 min-h-[450px]">
                {renderActiveMode()}
            </CardContent>
        </Card>
    );
}
