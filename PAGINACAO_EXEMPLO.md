# Guia de Uso: Paginação no Frontend

## 📦 Arquivos Criados

### 1. Tipos e Utilitários ([dashboard/src/lib/api.ts](dashboard/src/lib/api.ts))

```typescript
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
```

### 2. Componente de Paginação ([dashboard/src/components/ui/data-pagination.tsx](dashboard/src/components/ui/data-pagination.tsx))

Componente visual reutilizável que exibe controles de paginação.

### 3. Hook Personalizado ([dashboard/src/hooks/usePagination.ts](dashboard/src/hooks/usePagination.ts))

Hook que gerencia o estado de paginação (página atual e limite).

## 🚀 Como Usar

### Exemplo Completo: TurmasManager

```typescript
"use client";

import { useState } from "react";
import { useTurmas } from "@/hooks/useApi";
import { usePagination } from "@/hooks/usePagination";
import { DataPagination } from "@/components/ui/data-pagination";
import { TableSkeleton } from "@/components/ui/skeletons";

export function TurmasManagerPaginado() {
  // Estado de filtros
  const [escolaId, setEscolaId] = useState<string | undefined>();
  const [anoLetivo, setAnoLetivo] = useState<number | undefined>();

  // Estado de paginação
  const { pagination, handlePageChange, handleLimitChange } = usePagination({
    initialPage: 1,
    initialLimit: 20,
  });

  // Buscar dados paginados
  const { data, isLoading, error } = useTurmas(
    { escolaId, anoLetivo },
    pagination  // Passa os parâmetros de paginação
  );

  if (isLoading) return <TableSkeleton rows={5} columns={6} />;
  if (error) return <div>Erro ao carregar turmas</div>;

  // Se a API não retornar paginação, usar modo não-paginado
  const isPaginated = data && 'pagination' in data;
  const turmas = isPaginated ? data.data : (data || []);
  const paginationMeta = isPaginated ? data.pagination : null;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex gap-4">
        <select onChange={(e) => setEscolaId(e.target.value || undefined)}>
          <option value="">Todas as escolas</option>
          {/* ... opções */}
        </select>
      </div>

      {/* Tabela de dados */}
      <div className="border rounded-md">
        <table className="w-full">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Escola</th>
              <th>Série</th>
              <th>Turno</th>
              <th>Alunos</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.map((turma) => (
              <tr key={turma.id}>
                <td>{turma.nome}</td>
                <td>{turma.escola?.nome}</td>
                <td>{turma.serie?.nome}</td>
                <td>{turma.turno}</td>
                <td>{turma.matriculas?.length || 0}</td>
                <td>
                  {/* Ações */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginação */}
      {paginationMeta && (
        <DataPagination
          pagination={paginationMeta}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      )}
    </div>
  );
}
```

## 📝 APIs Atualizadas com Paginação

Todos os seguintes endpoints agora suportam paginação opcional:

### Principais
- `turmasApi.list(filters?, pagination?)`
- `matriculasApi.list(filters?, pagination?)`
- `profissionaisApi.list(filters?, pagination?)`

### Gestão de Pessoas
- `pontosApi.list(filters?, pagination?)`
- `licencasApi.list(filters?, pagination?)`

### Comunicação
- `comunicadoApi.list(filters?, pagination?)`
- `notificacaoApi.list(filters?, pagination?)`
- `reuniaoPaisApi.list(filters?, pagination?)`

## 🎯 Comportamento da API

### Com Paginação
```typescript
const { data } = useTurmas({}, { page: 1, limit: 20 });
// Retorna: { data: Turma[], pagination: PaginationMeta }
```

### Sem Paginação (Retrocompatível)
```typescript
const { data } = useTurmas();
// Retorna: Turma[] (como antes)
```

## 🔧 Atualizando Hooks useApi

O hook `useApi.ts` precisa ser atualizado para aceitar parâmetros de paginação. Exemplo:

```typescript
// ANTES
export const useTurmas = (filters?: TurmaFilters) =>
  useQuery({
    queryKey: ["turmas", filters],
    queryFn: () => turmasApi.list(filters),
  });

// DEPOIS
export const useTurmas = (
  filters?: TurmaFilters,
  pagination?: PaginationParams
) =>
  useQuery({
    queryKey: ["turmas", filters, pagination],
    queryFn: () => turmasApi.list(filters, pagination),
  });
```

## ✨ Recursos do Componente DataPagination

- ✅ Navegação por páginas (anterior/próxima)
- ✅ Seleção direta de página
- ✅ Elipses (...) para muitas páginas
- ✅ Seletor de itens por página (10, 20, 50, 100)
- ✅ Contador de resultados ("Mostrando 1 a 20 de 100")
- ✅ Responsivo (adaptado para mobile)
- ✅ Acessível (ARIA labels)

## 🎨 Exemplo Visual

```
┌─────────────────────────────────────────────────────────────┐
│ Filtros: [Escola ▼] [Ano Letivo ▼] [Buscar 🔍]           │
├─────────────────────────────────────────────────────────────┤
│                    Tabela de Dados                          │
│  Nome    │ Escola    │ Série  │ Turno    │ Alunos │ Ações  │
│  5º A    │ Escola 1  │ 5º Ano │ Matutino │ 28/30  │ [👁️📝] │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│ Mostrando 1 a 20 de 156 resultados    Por página: [20 ▼]   │
│                          [◀ Anterior] [1] [2] [3] ... [8]  │
│                          [Próxima ▶]                        │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Importante

1. **Retrocompatibilidade**: Todos os componentes existentes continuam funcionando sem modificação
2. **Opt-in**: Paginação é opcional - só use onde necessário
3. **Performance**: Use paginação em listas com mais de 50 itens
4. **Cache**: O React Query cacheia automaticamente cada combinação de filtros + página

## 📚 Próximos Passos

Para habilitar paginação em um componente Manager existente:

1. Importe o hook `usePagination`
2. Importe o componente `DataPagination`
3. Passe os parâmetros de paginação para o hook de dados
4. Adicione o componente `<DataPagination />` no final da lista
5. Ajuste a lógica para verificar se os dados são paginados

Exemplo de verificação:
```typescript
const isPaginated = data && 'pagination' in data;
const items = isPaginated ? data.data : (data || []);
```
