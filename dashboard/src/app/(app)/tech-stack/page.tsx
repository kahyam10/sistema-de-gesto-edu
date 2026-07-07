"use client";

import { TechStackTab } from "@/components/TechStackTab";

export default function TechStackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tech Stack</h1>
        <p className="text-muted-foreground mt-1">
          Tecnologias e ferramentas utilizadas no projeto
        </p>
      </div>
      <TechStackTab />
    </div>
  );
}
