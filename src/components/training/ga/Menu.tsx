
'use client';
import { Card, CardContent } from "@/components/ui/card";

export type MenuProps = {
    onSelectMode: (mode: string) => void;
    modes: { key: string, title: string, Icon: React.ElementType }[];
}

export const Menu = ({ onSelectMode, modes }: MenuProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center w-full max-w-2xl">
    {modes.map(mode => {
      const { Icon, title, key } = mode;
      return (
        <Card key={key} className="bg-violet-900 hover:bg-violet-800 transition-colors cursor-pointer" onClick={() => onSelectMode(key)}>
          <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
            <Icon className="w-8 h-8 text-violet-400" />
            <p className="font-semibold text-violet-100">{title}</p>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
