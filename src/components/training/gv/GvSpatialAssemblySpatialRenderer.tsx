
'use client';

import React, { useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { BaseRendererProps } from "@/types";
import type { GvSpatialAssemblyState, GvSpatialAssemblyEvent } from "./gv-spatial-assembly";

// Placeholder for a real Three.js or other WebGL renderer
const WebGLCanvas = ({ onUnmount, label }: { onUnmount: () => void, label: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        // In a real implementation, you would initialize your Three.js scene here.
        // const renderer = new THREE.WebGLRenderer({ canvas });
        // ... scene setup ...

        return () => {
            // --- WebGL & Memory Management (B2.1) ---
            // This cleanup is CRITICAL to prevent memory leaks and WebGL context loss on mobile.
            // renderer.dispose();
            // renderer.forceContextLoss();
            onUnmount(); // Signal to parent that cleanup is done
        };
    }, [onUnmount]);

    return <canvas ref={canvasRef} className="w-full h-full rounded-lg" role="img" aria-label={label} />;
};


export const GvSpatialAssemblySpatialRenderer: React.FC<BaseRendererProps<GvSpatialAssemblyState, GvSpatialAssemblyEvent>> = (props) => {

    const handleUnmount = () => {
        // This function is called when the WebGL canvas is unmounted.
    };

    const canvasLabel = `A 3D spatial assembly puzzle. Current state: ${props.gameState.gameState}. Fragments are being displayed.`;

    return (
         <Card className="w-full max-w-2xl bg-gray-950 border-lime-500/20 text-gray-100">
            <CardHeader className="text-center">
                <CardTitle>Spatial Assembly (3D)</CardTitle>
                <CardDescription>This is a placeholder for the 3D renderer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-6 min-h-[450px] justify-center">
                <div className="w-full h-96 bg-gray-900 rounded-lg">
                    <WebGLCanvas onUnmount={handleUnmount} label={canvasLabel} />
                </div>
                 <p className="text-sm text-muted-foreground">This demonstrates the correct memory cleanup and accessibility patterns for WebGL contexts.</p>
            </CardContent>
        </Card>
    );
};
