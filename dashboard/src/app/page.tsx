'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { GraduationCap, ListChecks, Calendar, ChartBar, Code, Rocket, Wrench, Notebook, MagnifyingGlass, Bell, GearSix, UserCircle, BookOpenText, Clock, Student } from '@phosphor-icons/react'
import { kpis, techStack } from '@/lib/data'
import { OverviewTab } from '@/components/OverviewTab'
import { ModulesTab } from '@/components/ModulesTab'
import { TimelineTab } from '@/components/TimelineTab'
import { KPITab } from '@/components/KPITab'
import { TechStackTab } from '@/components/TechStackTab'
import { DevelopmentTab } from '@/components/DevelopmentTab'
import { CadastrosTab } from '@/components/CadastrosTab'
import { PedagogicoTab } from '@/components/PedagogicoTab'
import { RHTab } from '@/components/RHTab'
import { ProgramasEspeciaisTab } from '@/components/ProgramasEspeciaisTab'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-screen flex-row">
        <aside className="hidden lg:flex w-64 flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 text-white">
          <div>
            <div className="flex items-center gap-3 px-6 py-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-wide">SGE</p>
                <p className="text-xs text-white/60">Ibirapitanga</p>
              </div>
            </div>
            <div className="px-4">
              <p className="px-2 pb-2 text-[11px] uppercase tracking-widest text-white/40">Main</p>
              <TabsList className="flex h-auto flex-col items-stretch gap-1 bg-transparent p-0">
                <TabsTrigger value="overview" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <ChartBar className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="modules" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <ListChecks className="h-4 w-4" />
                  <span>Módulos</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Calendar className="h-4 w-4" />
                  <span>Cronograma</span>
                </TabsTrigger>
                <TabsTrigger value="cadastros" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Notebook className="h-4 w-4" />
                  <span>Cadastros</span>
                </TabsTrigger>
                <TabsTrigger value="pedagogico" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <BookOpenText className="h-4 w-4" />
                  <span>Pedagogico</span>
                </TabsTrigger>
                <TabsTrigger value="rh" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Clock className="h-4 w-4" />
                  <span>RH</span>
                </TabsTrigger>
                <TabsTrigger value="programas" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Student className="h-4 w-4" />
                  <span>Programas Especiais</span>
                </TabsTrigger>
                <TabsTrigger value="development" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Wrench className="h-4 w-4" />
                  <span>Desenvolvimento</span>
                </TabsTrigger>
                <TabsTrigger value="kpis" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Rocket className="h-4 w-4" />
                  <span>KPIs</span>
                </TabsTrigger>
                <TabsTrigger value="tech" className="justify-start gap-3 rounded-lg px-3 py-2.5 text-white/70 data-[state=active]:bg-white/10 data-[state=active]:text-white">
                  <Code className="h-4 w-4" />
                  <span>Tech Stack</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-3">
              <div className="h-10 w-10 rounded-full bg-white/20" />
              <div className="text-xs">
                <p className="font-semibold">Kahyam Souza</p>
                <p className="text-white/60">Admin</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-6 py-4 lg:px-10">
              <div>
                <h1 className="text-xl font-semibold">Dashboard 👋</h1>
                <p className="text-xs text-slate-500">Sistema de Gestão Educacional</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative hidden md:block">
                  <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input placeholder="Pesquisar ou digitar comando" className="w-80 rounded-full bg-slate-50 pl-9" />
                </div>
                <button className="hidden md:inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs text-slate-500">⌘ F</button>
                <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <GearSix className="h-4 w-4" />
                </button>
                <button className="rounded-full border border-slate-200 p-2 text-slate-500 hover:bg-slate-100">
                  <UserCircle className="h-4 w-4" />
                </button>
                <ThemeToggle />
              </div>
            </div>
            <div className="px-6 pb-4 lg:hidden">
              <TabsList className="grid w-full grid-cols-2 gap-2 bg-transparent p-0">
                <TabsTrigger value="overview" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <ChartBar className="h-4 w-4" />
                  <span>Visão Geral</span>
                </TabsTrigger>
                <TabsTrigger value="modules" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <ListChecks className="h-4 w-4" />
                  <span>Módulos</span>
                </TabsTrigger>
                <TabsTrigger value="timeline" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Calendar className="h-4 w-4" />
                  <span>Cronograma</span>
                </TabsTrigger>
                <TabsTrigger value="cadastros" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Notebook className="h-4 w-4" />
                  <span>Cadastros</span>
                </TabsTrigger>
                <TabsTrigger value="pedagogico" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <BookOpenText className="h-4 w-4" />
                  <span>Pedagogico</span>
                </TabsTrigger>
                <TabsTrigger value="rh" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Clock className="h-4 w-4" />
                  <span>RH</span>
                </TabsTrigger>
                <TabsTrigger value="programas" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Student className="h-4 w-4" />
                  <span>Programas</span>
                </TabsTrigger>
                <TabsTrigger value="development" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Wrench className="h-4 w-4" />
                  <span>Dev</span>
                </TabsTrigger>
                <TabsTrigger value="kpis" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Rocket className="h-4 w-4" />
                  <span>KPIs</span>
                </TabsTrigger>
                <TabsTrigger value="tech" className="justify-start gap-2 rounded-lg border border-slate-200 bg-white py-2.5 text-slate-700 data-[state=active]:border-primary data-[state=active]:text-primary">
                  <Code className="h-4 w-4" />
                  <span>Tech</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 lg:px-10">
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>

            <TabsContent value="modules">
              <ModulesTab />
            </TabsContent>

            <TabsContent value="timeline">
              <TimelineTab />
            </TabsContent>

            <TabsContent value="cadastros">
              <CadastrosTab />
            </TabsContent>

            <TabsContent value="pedagogico">
              <PedagogicoTab />
            </TabsContent>

            <TabsContent value="rh">
              <RHTab />
            </TabsContent>

            <TabsContent value="programas">
              <ProgramasEspeciaisTab />
            </TabsContent>

            <TabsContent value="development">
              <DevelopmentTab />
            </TabsContent>

            <TabsContent value="kpis">
              <KPITab kpis={kpis} />
            </TabsContent>

            <TabsContent value="tech">
              <TechStackTab techStack={techStack} />
            </TabsContent>
          </main>

          <footer className="border-t border-slate-200/70 bg-white/70 py-6">
            <div className="flex flex-col items-center justify-between gap-3 px-6 text-xs text-slate-500 md:flex-row lg:px-10">
              <div>
                <p className="text-sm font-medium text-slate-700">KSsoft - Soluções Tecnológicas</p>
              </div>
              <div>Dashboard de Progresso do Projeto</div>
            </div>
          </footer>
        </div>
      </Tabs>
    </div>
  )
}
