"use client";

import Link from "next/link";
import { PageWrap } from "@/components/ui/page-wrap";
import { Icon, type IconName } from "@/components/ui/icons";

const cadastrosItems: {
  title: string;
  description: string;
  href: string;
  icon: IconName;
  color: string;
}[] = [
  {
    title: "Calendário Letivo",
    description: "Gerencie o calendário letivo, feriados e eventos escolares",
    href: "/cadastros/calendario",
    icon: "calendarDays",
    color: "#1351B4",
  },
  {
    title: "Hierarquia de Ensino",
    description: "Configure tipos de educação, etapas, níveis e séries",
    href: "/cadastros/hierarquia",
    icon: "hierarchy",
    color: "#3B86A8",
  },
  {
    title: "Escolas",
    description: "Cadastre e gerencie as escolas da rede municipal",
    href: "/cadastros/escolas",
    icon: "building",
    color: "#1F6FB2",
  },
  {
    title: "Profissionais",
    description: "Gerencie professores, auxiliares e demais profissionais",
    href: "/cadastros/profissionais",
    icon: "users",
    color: "#A94B8C",
  },
  {
    title: "Matrículas",
    description: "Realize e gerencie matrículas de alunos",
    href: "/cadastros/matriculas",
    icon: "userPlus",
    color: "#0F8A5F",
  },
];

export default function CadastrosPage() {
  return (
    <PageWrap
      title="Cadastros"
      subtitle="Escolas, hierarquia de ensino, profissionais e matrículas da rede"
      breadcrumb={[{ label: "Início" }, { label: "Cadastros" }]}
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cadastrosItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group relative block rounded-md border border-hairline bg-surface p-4 shadow-sm transition-colors duration-180 hover:border-brand-300 hover:shadow-md"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{ background: `${item.color}1A` }}
              >
                <Icon name={item.icon} size={17} strokeWidth={1.8} style={{ color: item.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold leading-tight tracking-[-0.1px] text-ink">
                  {item.title}
                </div>
                <div className="mt-1 text-[12.5px] leading-[1.5] text-ink-muted">
                  {item.description}
                </div>
              </div>
              <Icon
                name="chevron"
                size={13}
                className="mt-1 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand"
              />
            </div>
          </Link>
        ))}
      </div>
    </PageWrap>
  );
}
