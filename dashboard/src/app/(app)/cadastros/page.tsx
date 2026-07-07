"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDots, TreeStructure, Buildings, Users, UserPlus } from "@phosphor-icons/react";

const cadastrosItems = [
  {
    title: "Calendário Letivo",
    description: "Gerencie o calendário letivo, feriados e eventos escolares",
    href: "/cadastros/calendario",
    icon: <CalendarDots size={32} weight="duotone" className="text-blue-600" />,
  },
  {
    title: "Hierarquia de Ensino",
    description: "Configure tipos de educação, etapas, níveis e séries",
    href: "/cadastros/hierarquia",
    icon: <TreeStructure size={32} weight="duotone" className="text-green-600" />,
  },
  {
    title: "Escolas",
    description: "Cadastre e gerencie as escolas da rede municipal",
    href: "/cadastros/escolas",
    icon: <Buildings size={32} weight="duotone" className="text-orange-600" />,
  },
  {
    title: "Profissionais",
    description: "Gerencie professores, auxiliares e demais profissionais",
    href: "/cadastros/profissionais",
    icon: <Users size={32} weight="duotone" className="text-purple-600" />,
  },
  {
    title: "Matrículas",
    description: "Realize e gerencie matrículas de alunos",
    href: "/cadastros/matriculas",
    icon: <UserPlus size={32} weight="duotone" className="text-teal-600" />,
  },
];

export default function CadastrosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sistema de Cadastros</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie escolas, etapas de ensino, profissionais e matrículas de alunos
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cadastrosItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="h-full hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                {item.icon}
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
