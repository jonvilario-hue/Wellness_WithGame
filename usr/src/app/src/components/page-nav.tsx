'use client';
import { usePathname, useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, BrainCircuit, HeartPulse, BookOpen, Scaling } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reflections', label: 'Reflections', icon: BrainCircuit },
  { href: '/health-check', label: 'Health Check', icon: HeartPulse },
  { href: '/scholar-hub', label: 'Scholar Hub', icon: BookOpen },
  { href: '/architect-lab', label: 'Architect Lab', icon: Scaling },
];

export function PageNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleTabChange = (value: string) => {
    router.push(value);
  };

  return (
    <div className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <Tabs value={pathname} onValueChange={handleTabChange}>
          <TabsList className="bg-transparent p-0 h-14 rounded-none">
            {navItems.map(({ href, label, icon: Icon }) => (
              <TabsTrigger key={href} value={href} className="text-muted-foreground data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-4 gap-2">
                <Icon className="h-5 w-5" /> {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
