"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  House,
  SquaresFour,
  Calendar,
  Folder,
  Code,
  ChartBar,
  Cpu,
  CalendarDots,
  TreeStructure,
  Buildings,
  Users,
  UserPlus,
  CaretDown,
  CaretRight,
  List,
  SignOut,
} from "@phosphor-icons/react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/",
    icon: <House size={20} weight="duotone" />,
  },
  {
    title: "Módulos",
    href: "/modulos",
    icon: <SquaresFour size={20} weight="duotone" />,
  },
  {
    title: "Cronograma",
    href: "/cronograma",
    icon: <Calendar size={20} weight="duotone" />,
  },
  {
    title: "Cadastros",
    href: "/cadastros",
    icon: <Folder size={20} weight="duotone" />,
    children: [
      {
        title: "Calendário Letivo",
        href: "/cadastros/calendario",
        icon: <CalendarDots size={18} weight="duotone" />,
      },
      {
        title: "Hierarquia de Ensino",
        href: "/cadastros/hierarquia",
        icon: <TreeStructure size={18} weight="duotone" />,
      },
      {
        title: "Escolas",
        href: "/cadastros/escolas",
        icon: <Buildings size={18} weight="duotone" />,
      },
      {
        title: "Profissionais",
        href: "/cadastros/profissionais",
        icon: <Users size={18} weight="duotone" />,
      },
      {
        title: "Matrículas",
        href: "/cadastros/matriculas",
        icon: <UserPlus size={18} weight="duotone" />,
      },
    ],
  },
  {
    title: "Desenvolvimento",
    href: "/desenvolvimento",
    icon: <Code size={20} weight="duotone" />,
  },
  {
    title: "KPIs",
    href: "/kpis",
    icon: <ChartBar size={20} weight="duotone" />,
  },
  {
    title: "Tech Stack",
    href: "/tech-stack",
    icon: <Cpu size={20} weight="duotone" />,
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["/cadastros"]);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus.includes(item.href);
    const active = isActive(item.href);

    if (hasChildren) {
      return (
        <Collapsible
          key={item.href}
          open={isOpen}
          onOpenChange={() => toggleMenu(item.href)}
        >
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-10",
                active && "bg-accent text-accent-foreground",
                isCollapsed && "justify-center px-2"
              )}
            >
              {item.icon}
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.title}</span>
                  {isOpen ? (
                    <CaretDown size={16} />
                  ) : (
                    <CaretRight size={16} />
                  )}
                </>
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pl-4">
            {item.children?.map((child) => renderNavItem(child, depth + 1))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <Link key={item.href} href={item.href}>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 px-3 py-2 h-10",
            active && "bg-accent text-accent-foreground font-medium",
            isCollapsed && "justify-center px-2",
            depth > 0 && "h-9 text-sm"
          )}
        >
          {item.icon}
          {!isCollapsed && <span>{item.title}</span>}
        </Button>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Buildings size={20} weight="bold" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">SGE</span>
              <span className="text-xs text-muted-foreground">Ibirapitanga</span>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="h-8 w-8"
        >
          <List size={20} />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-8rem)] py-4">
        <nav className="space-y-1 px-2">
          {navItems.map((item) => renderNavItem(item))}
        </nav>
      </ScrollArea>

      <div className="flex h-16 items-center gap-2 border-t px-3">
        {!isCollapsed && user && (
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium">{user.nome}</span>
            <span className="truncate text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="h-8 w-8 shrink-0"
          title="Sair"
        >
          <SignOut size={20} />
        </Button>
      </div>
    </aside>
  );
}
