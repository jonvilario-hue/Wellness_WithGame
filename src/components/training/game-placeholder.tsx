
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface GamePlaceholderProps {
    title: string;
    description: string;
}

export function GamePlaceholder({ title, description }: GamePlaceholderProps) {
  return (
    <Card className="w-full max-w-2xl text-center border-dashed">
      <CardHeader>
        <div className="flex flex-col items-center gap-4 text-amber-500">
            <Construction className="w-10 h-10" />
            <CardTitle className="text-2xl">{title}: Under Construction</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
