# Política de Retenção — Documentos Digitalizados de Matrícula

Sistema de Gestão Educacional — Secretaria Municipal de Educação de Ibirapitanga-BA.
Escopo: arquivos enviados via upload na matrícula (tabela `documentos_matricula` +
storage configurado por `STORAGE_DRIVER`/`UPLOADS_DIR`). Não cobre os demais dados
cadastrais do sistema.

## O que guardamos

Cópias digitalizadas (PDF/JPG/PNG, máx. 10MB) dos documentos exigidos no ato da
matrícula: certidão de nascimento, RG/CPF do aluno e do responsável, foto 3x4,
cartão do SUS, caderneta de vacinação, comprovante de residência, histórico
escolar, declaração de transferência, laudo médico e outros. Para cada arquivo:
nome original, tipo, formato, tamanho, data do envio e identificação de quem enviou.

A maioria dos titulares são crianças e adolescentes (art. 14 da LGPD); o laudo
médico é dado sensível (art. 5º, II) — o acesso de leitura é restrito à equipe
operacional (ADMIN, SEMEC, DIRETOR, COORDENADOR, SECRETARIA); professores e
demais usuários autenticados não acessam.

## Por que guardamos (finalidade e base legal)

Comprovação documental do vínculo de matrícula na rede municipal — execução de
políticas públicas de educação (art. 7º, III e art. 23 da LGPD) e cumprimento
de obrigação legal de escrituração escolar. Não há uso secundário: os arquivos
não alimentam relatórios, integrações ou decisões automatizadas.

## Por quanto tempo

- **Enquanto a matrícula existir no sistema**: os arquivos ficam disponíveis à
  equipe operacional.
- **Laudo médico**: pode ser expurgado a pedido do responsável assim que deixar
  de ser necessário (ex.: encerramento do AEE), sem esperar o fim do vínculo.
- **Ao excluir a matrícula**: os arquivos físicos são apagados ANTES da exclusão
  do registro (`matriculaService.delete` → `expurgarArquivos`), e os metadados
  caem junto por cascade. Nada permanece no storage.
- Recomendação administrativa: revisar anualmente matrículas CANCELADAS ou
  TRANSFERIDAS há mais de 5 anos e executar o expurgo. O histórico escolar
  (notas/frequência) NÃO é afetado pelo expurgo de documentos — guarda própria,
  de longo prazo, conforme normas de escrituração escolar.

## Como expurgar

1. **Um documento**: `DELETE /api/matriculas/:id/documentos/:documentoId`
   (equipe operacional) — apaga registro e arquivo; desmarca o item no checklist
   se era o último daquele tipo.
2. **Todos os documentos de uma matrícula (expurgo)**:
   `DELETE /api/matriculas/:id/documentos` — restrito a ADMIN/SEMEC. Apaga todos
   os arquivos físicos, todos os registros e zera o checklist
   (`documentosEntregues = null`). Na interface: botão "Expurgar todos (LGPD)"
   no detalhe do aluno, visível apenas para gestão.
3. **Exclusão da matrícula**: expurga automaticamente (ver acima).

## Limitações conhecidas (honestas)

- Não há trilha de auditoria de downloads (quem baixou o quê); existe apenas o
  registro de quem enviou.
- O expurgo não gera comprovante formal; a resposta da API informa a quantidade
  de arquivos removidos.
- Backups do volume `uploads` (se configurados fora deste repositório) precisam
  de rotação própria — o expurgo só alcança o storage ativo.
