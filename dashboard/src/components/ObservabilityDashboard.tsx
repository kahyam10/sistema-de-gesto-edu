"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { observabilityApi, type SystemOverview, type ErrorLog, type RouteMetric } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartLine,
  Warning,
  CheckCircle,
  XCircle,
  Clock,
  Heartbeat,
  Database,
  Cpu,
  HardDrives,
} from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    CRITICAL: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return colors[severity] || colors.MEDIUM;
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    HEALTHY: "text-green-600",
    DEGRADED: "text-yellow-600",
    DOWN: "text-red-600",
  };
  return colors[status] || colors.DEGRADED;
}

export function ObservabilityDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch overview data
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["observability", "overview"],
    queryFn: () => observabilityApi.getOverview(),
    refetchInterval: 30000, // Refresh every 30s
  });

  // Fetch errors
  const { data: errors, isLoading: loadingErrors } = useQuery({
    queryKey: ["observability", "errors"],
    queryFn: () => observabilityApi.getErrors({ resolved: false, sortBy: "lastSeen", order: "desc" }),
  });

  // Fetch routes
  const { data: routes, isLoading: loadingRoutes } = useQuery({
    queryKey: ["observability", "routes"],
    queryFn: () => observabilityApi.getRoutes({ sortBy: "totalRequests", order: "desc" }),
  });

  if (loadingOverview) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Observabilidade</h1>
        <p className="text-muted-foreground">
          Monitoramento e métricas do sistema em tempo real
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Requisições (24h)
            </CardTitle>
            <Heartbeat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview?.summary.totalRequests24h.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {overview?.summary.errorRate.toFixed(2)}% taxa de erro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo Médio
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(overview?.summary.avgResponseTime || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Tempo de resposta médio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Erros (24h)
            </CardTitle>
            <Warning className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overview?.summary.errors24h || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Erros nas últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Database className={`h-4 w-4 ${getStatusColor(overview?.systemHealth.status || "DEGRADED")}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(overview?.systemHealth.status || "DEGRADED")}`}>
              {overview?.systemHealth.status || "UNKNOWN"}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(overview?.systemHealth.uptime || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde do Sistema</CardTitle>
          <CardDescription>Métricas de recursos do servidor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4">
              <HardDrives className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Uso de Memória</p>
                <p className="text-2xl font-bold">
                  {formatBytes(overview?.systemHealth.memoryUsage || 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Cpu className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Uso de CPU</p>
                <p className="text-2xl font-bold">
                  {overview?.systemHealth.cpuUsage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="errors">
            Erros {errors && errors.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errors.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="routes">Rotas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rotas Mais Acessadas</CardTitle>
              <CardDescription>Top 10 endpoints por volume de requisições</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {overview?.topRoutes.slice(0, 10).map((route, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{route.method}</Badge>
                        <code className="text-sm">{route.path}</code>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span>{route.totalRequests.toLocaleString()} req</span>
                      {route.errorCount > 0 && (
                        <span className="text-red-600">{route.errorCount} erros</span>
                      )}
                      <span className="text-muted-foreground">
                        {formatDuration(route.avgDuration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Não Resolvidos</CardTitle>
              <CardDescription>Erros recentes que precisam de atenção</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingErrors ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : errors && errors.length > 0 ? (
                <div className="space-y-3">
                  {errors.map((error) => (
                    <div
                      key={error.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getSeverityColor(error.severity)}>
                              {error.severity}
                            </Badge>
                            {error.module && (
                              <Badge variant="outline">{error.module}</Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {error.count}x ocorrências
                            </span>
                          </div>
                          <p className="font-medium">{error.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Última vez: {new Date(error.lastSeen).toLocaleString()}
                          </p>
                        </div>
                        <Button size="sm" variant="outline">
                          Resolver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-600" />
                  <p>Nenhum erro não resolvido</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas por Rota</CardTitle>
              <CardDescription>Performance e estatísticas de cada endpoint</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRoutes ? (
                <Skeleton className="h-96" />
              ) : routes && routes.length > 0 ? (
                <div className="space-y-2">
                  {routes.slice(0, 20).map((route) => (
                    <div key={route.id} className="border rounded p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{route.method}</Badge>
                          <code className="text-sm">{route.path}</code>
                          {route.module && (
                            <Badge variant="secondary">{route.module}</Badge>
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {route.totalRequests.toLocaleString()} req
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {route.successCount} sucesso
                        </span>
                        {route.errorCount > 0 && (
                          <span className="flex items-center gap-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            {route.errorCount} erros
                          </span>
                        )}
                        <span>Avg: {formatDuration(route.avgDuration)}</span>
                        <span>Min: {formatDuration(route.minDuration)}</span>
                        <span>Max: {formatDuration(route.maxDuration)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma métrica disponível</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
