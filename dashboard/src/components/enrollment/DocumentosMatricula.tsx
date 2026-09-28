"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DownloadSimple,
  FileArrowUp,
  Files,
  ListChecks,
  Spinner,
  Trash,
} from "@phosphor-icons/react";
import { toast } from "sonner";
import {
  useDeleteDocumentoMatricula,
  useDocumentosMatricula,
  useExpurgarDocumentosMatricula,
  useUploadDocumentoMatricula,
} from "@/hooks/useApi";
import type { Matricula, TipoDocumentoMatricula } from "@/lib/api";
import { documentosMatriculaApi } from "@/lib/api";
import { useEhGestao } from "@/hooks/use-papel";

const TIPO_LABELS: Record<TipoDocumentoMatricula, string> = {
  CERTIDAO_NASCIMENTO: "Certidão de Nascimento",
  RG_ALUNO: "RG do Aluno",
  CPF_ALUNO: "CPF do Aluno",
  FOTO_3X4: "Foto 3x4",
  CARTAO_SUS: "Cartão do SUS",
  CADERNETA_VACINACAO: "Caderneta de Vacinação",
  COMPROVANTE_RESIDENCIA: "Comprovante de Residência",
  RG_RESPONSAVEL: "RG do Responsável",
  CPF_RESPONSAVEL: "CPF do Responsável",
  HISTORICO_ESCOLAR: "Histórico Escolar",
  DECLARACAO_TRANSFERENCIA: "Declaração de Transferência",
  LAUDO_MEDICO: "Laudo Médico",
  OUTRO: "Outro",
};

const TIPOS_DOCUMENTO = Object.keys(TIPO_LABELS) as TipoDocumentoMatricula[];

const MIMES_ACEITOS = ["application/pdf", "image/jpeg", "image/png"];
const TAMANHO_MAXIMO = 10 * 1024 * 1024; // 10MB — igual ao limite do backend

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface DocumentosMatriculaProps {
  matricula: Matricula;
}

export function DocumentosMatricula({ matricula }: DocumentosMatriculaProps) {
  const [tipo, setTipo] = useState<TipoDocumentoMatricula>("CERTIDAO_NASCIMENTO");
  const [arquivo, setArquivo] = useState<File | null>(null);
  // Incrementa após upload para limpar o input de arquivo (não controlado)
  const [inputKey, setInputKey] = useState(0);

  const { data: documentos = [], isLoading } = useDocumentosMatricula(matricula.id);
  const uploadDocumento = useUploadDocumentoMatricula();
  const deleteDocumento = useDeleteDocumentoMatricula();
  const expurgarDocumentos = useExpurgarDocumentosMatricula();

  // Checklist chega como objeto jsonb (Record<tipo, boolean>) — guard defensivo
  const checklist: Record<string, boolean> =
    matricula.documentosEntregues && typeof matricula.documentosEntregues === "object"
      ? matricula.documentosEntregues
      : {};

  const podeExpurgar = useEhGestao();

  // Contagem de arquivos digitalizados por tipo
  const contagemPorTipo = documentos.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.tipo] = (acc[doc.tipo] ?? 0) + 1;
    return acc;
  }, {});

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivo) {
      toast.error("Selecione um arquivo");
      return;
    }
    if (!MIMES_ACEITOS.includes(arquivo.type)) {
      toast.error("Tipo de arquivo não permitido (apenas PDF, JPG e PNG)");
      return;
    }
    if (arquivo.size > TAMANHO_MAXIMO) {
      toast.error("Arquivo excede o tamanho máximo de 10MB");
      return;
    }
    try {
      await uploadDocumento.mutateAsync({ matriculaId: matricula.id, tipo, arquivo });
      setArquivo(null);
      setInputKey((k) => k + 1);
    } catch {
      // Erro já tratado pelo hook (toast)
    }
  };

  const handleDownload = async (documentoId: string, nomeOriginal: string) => {
    try {
      const blob = await documentosMatriculaApi.download(matricula.id, documentoId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = nomeOriginal;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao baixar documento");
    }
  };

  const handleDelete = async (documentoId: string) => {
    if (!confirm("Tem certeza que deseja excluir este documento?")) return;
    try {
      await deleteDocumento.mutateAsync({ matriculaId: matricula.id, documentoId });
    } catch {
      // Erro já tratado pelo hook (toast)
    }
  };

  const handleExpurgo = async () => {
    if (
      !confirm(
        "EXPURGO LGPD: todos os arquivos desta matrícula serão apagados em definitivo. Continuar?"
      )
    )
      return;
    if (!confirm("Confirma o expurgo definitivo? Esta ação não pode ser desfeita.")) return;
    try {
      await expurgarDocumentos.mutateAsync(matricula.id);
    } catch {
      // Erro já tratado pelo hook (toast)
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Checklist de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Checklist de Documentos
          </CardTitle>
          <CardDescription>
            Situação de entrega dos documentos exigidos na matrícula
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {TIPOS_DOCUMENTO.map((t) => {
              const entregue = checklist[t] === true;
              const qtd = contagemPorTipo[t] ?? 0;
              return (
                <div
                  key={t}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{TIPO_LABELS[t]}</p>
                    <p className="text-xs text-muted-foreground">
                      {qtd === 0
                        ? "Nenhum arquivo digitalizado"
                        : qtd === 1
                          ? "1 arquivo digitalizado"
                          : `${qtd} arquivos digitalizados`}
                    </p>
                  </div>
                  {entregue ? (
                    <Badge className="bg-green-100 text-green-800 shrink-0">Entregue</Badge>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Pendente
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Anexar Documento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileArrowUp className="h-5 w-5" />
            Anexar Documento
          </CardTitle>
          <CardDescription>PDF, JPG ou PNG — máximo de 10MB por arquivo</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleUpload}
            className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
          >
            <div className="space-y-2">
              <Label htmlFor="tipo-documento">Tipo do documento</Label>
              <Select
                value={tipo}
                onValueChange={(value: TipoDocumentoMatricula) => setTipo(value)}
              >
                <SelectTrigger id="tipo-documento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="arquivo-documento">Arquivo</Label>
              <Input
                key={inputKey}
                id="arquivo-documento"
                type="file"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" disabled={uploadDocumento.isPending || !arquivo}>
              {uploadDocumento.isPending ? (
                <Spinner className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileArrowUp className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Arquivos Digitalizados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Files className="h-5 w-5" />
            Arquivos Digitalizados
          </CardTitle>
          <CardDescription>
            {documentos.length === 0
              ? "Nenhum arquivo anexado a esta matrícula"
              : `${documentos.length} arquivo(s) anexado(s) a esta matrícula`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documentos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Files className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">
                Nenhum documento digitalizado. Use o formulário acima para anexar.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Enviado em</TableHead>
                  <TableHead>Enviado por</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_LABELS[doc.tipo] ?? doc.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[240px] truncate" title={doc.nomeOriginal}>
                      {doc.nomeOriginal}
                    </TableCell>
                    <TableCell>{formatBytes(doc.tamanho)}</TableCell>
                    <TableCell>{formatarDataHora(doc.createdAt)}</TableCell>
                    <TableCell>{doc.uploadedByNome}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Baixar documento"
                          onClick={() => handleDownload(doc.id, doc.nomeOriginal)}
                        >
                          <DownloadSimple className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Excluir documento"
                          disabled={deleteDocumento.isPending}
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Expurgo LGPD — apenas gestão (ADMIN/SEMEC) */}
          {podeExpurgar && documentos.length > 0 && (
            <div className="flex justify-end pt-4 mt-4 border-t">
              <Button
                variant="destructive"
                disabled={expurgarDocumentos.isPending}
                onClick={handleExpurgo}
              >
                {expurgarDocumentos.isPending ? (
                  <Spinner className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash className="h-4 w-4 mr-2" />
                )}
                Expurgar todos (LGPD)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
