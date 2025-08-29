import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Home, Globe2, Server, Boxes } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const nav = [
    { to: "/", label: "Dashboard", icon: Home },
    { to: "/domains", label: "Domains", icon: Globe2 },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      <aside className="fixed inset-y-0 left-0 w-64 border-r bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/50 hidden md:flex md:flex-col">
        <div className="px-6 py-6 border-b">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary/10 ring-1 ring-primary/30 grid place-items-center">
              <span className="text-primary font-black">H</span>
            </div>
            <div>
              <div className="font-bold leading-tight">HexControl</div>
              <div className="text-xs text-muted-foreground -mt-1">Server Manager</div>
            </div>
          </Link>
        </div>
        <nav className="px-3 py-4 space-y-1">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted", pathname === n.to && "bg-muted text-foreground") }>
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          ))}
          <div className="mt-6 px-3">
            <div className="text-xs uppercase text-muted-foreground mb-2">Coming soon</div>
            <div className="flex flex-col gap-1 opacity-60">
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted/50"><Server className="h-4 w-4"/>Nginx</div>
              <div className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium bg-muted/50"><Boxes className="h-4 w-4"/>Docker</div>
            </div>
          </div>
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center gap-4 px-4">
            <div className="md:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-md bg-primary/10 ring-1 ring-primary/30 grid place-items-center">
                  <span className="text-primary font-black">H</span>
                </div>
                <span className="font-bold">HexControl</span>
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-3 text-sm text-muted-foreground">
              <UserEmail />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
