
'use client';

import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/use-theme';

export function GrowthDecoration() {
  const { theme } = useTheme();
  
  // A more elaborate SVG with multiple paths and leaves for a richer visual.
  // The stroke color is now dynamically set by the active theme's accent color.
  const svgContent = `
    <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          .vine {
            fill: none;
            stroke: ${theme.colorScheme.accent};
            stroke-width: 1.2;
            stroke-linecap: round;
            stroke-linejoin: round;
            stroke-dasharray: 1500;
            stroke-dashoffset: 1500;
            animation: draw 15s ease-in-out forwards infinite;
          }
           .leaf {
            fill: ${theme.colorScheme.accent};
            stroke: ${theme.colorScheme.accent};
            stroke-width: 0.5;
            opacity: 0;
            animation: fadeIn 8s ease-in forwards infinite;
           }
        </style>
      </defs>
      
      <!-- Bottom-left growth -->
      <path class="vine" d="M1,299 C 40,200 80,300 120,150 S 180,0 250,100" style="animation-delay: 0s;"/>
      <g class="leaf" style="animation-delay: 7s;">
        <path d="M120,150 Q118,147 115,145" />
        <path d="M120,150 Q123,148 125,146" />
      </g>

      <!-- Top-right growth -->
      <path class="vine" d="M399,1 C 350,100 300,50 250,180 S 150,320 100,250" style="animation-delay: 2s;"/>
       <g class="leaf" style="animation-delay: 9s;">
        <path d="M250,180 Q253,177 255,175" />
        <path d="M250,180 Q247,178 245,176" />
      </g>
      
      <!-- Top-left to bottom-right -->
      <path class="vine" d="M1,1 C 100,100 50,250 200,200 S 350,50 399,299" style="animation-delay: 4s;"/>
       <g class="leaf" style="animation-delay: 11s;">
        <path d="M200,200 Q197,197 195,195" />
        <path d="M200,200 Q203,198 205,196" />
      </g>
    </svg>
  `;

  return (
    <div
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none mix-blend-soft-light"
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
