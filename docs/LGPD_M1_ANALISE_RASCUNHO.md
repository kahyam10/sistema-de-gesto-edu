# Análise LGPD — M1: matrícula online e histórico escolar (RASCUNHO)

> **Status:** rascunho técnico preparado pela equipe de desenvolvimento (KSSoft) em 27/09/2026
> para subsidiar decisões da Prefeitura de Ibirapitanga-BA **antes** de construir o M1.
> **Não é parecer jurídico.** Tudo marcado com `[PREENCHER: …]` é decisão ou dado que cabe à
> Prefeitura (SEMEC, encarregado de dados, procuradoria). Referências marcadas com `[CONFERIR]`
> precisam ser validadas pela procuradoria antes de qualquer uso oficial.
> Complementa `docs/LGPD_RETENCAO.md` (documentos digitalizados), que continua valendo.

---

## 0. Decisões pedidas à Prefeitura (resumo)

| # | Decisão | Por que importa | Resposta |
|---|---|---|---|
| D1 | Quem é o controlador formal (Município/SEMEC) e quem é o encarregado (art. 41 da LGPD) | Aviso de privacidade e canal dos titulares dependem disso | `[PREENCHER: controlador e nome/contato do encarregado]` |
| D2 | Instrumento que vincula a KSSoft como operadora (contrato/cláusulas LGPD) | Define responsabilidades, suboperadores e incidentes | `[PREENCHER: nº e data do contrato]` |
| D3 | Onde o sistema será hospedado (provedor, país, backups) | Transferência internacional (arts. 33–36) e segurança | `[PREENCHER: provedor, localização dos dados e dos backups]` |
| D4 | O que a matrícula online coleta (ver §3 — proposta: pré-matrícula mínima) | Minimização (art. 6º, III) com dados de crianças | `[PREENCHER]` |
| D5 | Documentos e dados de saúde entram pela internet ou só na secretaria da escola? | Upload público de documentos e dados sensíveis é o maior risco do M1 | `[PREENCHER]` |
| D6 | Como confirmar que quem preenche é responsável pela criança | Evita matrícula fraudulenta e exposição de dados de terceiros | `[PREENCHER: ex.: conferência presencial obrigatória]` |
| D7 | Proteção contra robôs no formulário público (CAPTCHA de terceiro ou só limites de uso) | CAPTCHA externo envia dados de navegação a terceiro | `[PREENCHER]` |
| D8 | Prazo para apagar pré-matrículas não efetivadas | Retenção (art. 15/16) | `[PREENCHER: prazo]` |
| D9 | Validade e forma de autenticação do histórico escolar emitido pelo sistema | Documento com valor jurídico | `[PREENCHER: assinatura digital? código de verificação? norma aplicável]` |
| D10 | Prazo de guarda do histórico escolar e norma que o fixa | Escrituração escolar é de longo prazo | `[PREENCHER: prazo e norma — CEE-BA/SEC-BA?]` |
| D11 | Prazo e canal para responder pedidos dos titulares (art. 18) | Hoje não há fluxo formal | `[PREENCHER]` |
| D12 | Responsável e rito para incidentes (art. 48) | Comunicação à ANPD e aos titulares | `[PREENCHER]` |
| D13 | (Achado da validação de 27/09, fora do M1) DIRETOR, COORDENADOR e SECRETARIA devem ver banco, agência, conta e PIX dos profissionais? Hoje veem, em `/api/profissionais`. | Dados financeiros de servidores | `[PREENCHER]` |

---

## 1. Escopo

**O que é o M1 neste documento** (ainda **não** construído):

1. **Matrícula online** — formulário público em que a família solicita vaga/matrícula
   pela internet, sem ir à escola na primeira etapa.
2. **Histórico escolar** — consolidação do percurso do aluno (anos, séries, escolas, notas,
   frequência, situação final, transferências) e emissão do documento.

**O que já existe e é reaproveitado:** cadastro interno de matrícula (feito pela secretaria
da escola), portal e app do responsável, boletim, frequência, documentos digitalizados
(`LGPD_RETENCAO.md`), exportações Educacenso e Sistema Presença.

## 2. Agentes de tratamento

| Papel (LGPD) | Quem | Situação |
|---|---|---|
| Controlador (art. 5º, VI) | `[PREENCHER: Município de Ibirapitanga / SEMEC]` | a confirmar |
| Operador (art. 5º, VII) | KSSoft Soluções Tecnológicas | contrato `[PREENCHER]` |
| Encarregado (art. 41) | `[PREENCHER]` | sem definição no sistema; o app só mostra link da política se `EXPO_PUBLIC_POLITICA_PRIVACIDADE_URL` for configurado |
| Suboperadores | hospedagem `[PREENCHER]`; se adotados: provedor de e-mail/SMS/push (M9, adiado), CAPTCHA (D7) | nenhum em uso hoje |

Titulares: **alunos (em maioria crianças e adolescentes — art. 14)**, responsáveis, profissionais.

## 3. Inventário de dados e proposta de minimização

Base: modelo `Matricula` atual (`backend/prisma/schema.prisma`). "Sensível" segue o art. 5º, II
(origem racial ou étnica, dado referente à saúde).

| Grupo | Campos hoje | Categoria | Proposta para a **matrícula online** |
|---|---|---|---|
| Identificação do aluno | nome, data de nascimento, sexo, naturalidade, nacionalidade | comum (criança) | coletar |
| Documentos do aluno | CPF, RG | comum (criança) | CPF opcional online; conferência na escola |
| Cor/raça | `corRaca` | **sensível** | **não coletar online**; hoje só é exigido pelo Censo — coletar na escola, com opção "não declarada" `[CONFERIR categorias do Educacenso]` |
| Deficiência | `possuiDeficiencia`, `tipoDeficiencia` | **sensível (saúde)** | online só a pergunta sim/não para planejar vaga/AEE `[decisão D4]`; detalhe e laudo na escola |
| Saúde | tipo sanguíneo, alergias, medicamentos, condições, cartão SUS, plano de saúde | **sensível** | **não coletar online** (D5); preencher na escola |
| Emergência | nome, telefone, parentesco | comum (terceiro) | coletar na escola |
| NIS | `nisAluno` | comum; finalidade específica (Bolsa Família) | **não coletar online**; só se a família for beneficiária, na escola |
| Responsável | nome, CPF, telefone, e-mail, parentesco | comum | nome, telefone e e-mail online (contato do pedido); CPF na escola |
| Endereço | logradouro, bairro, cidade, UF, CEP | comum | coletar (zoneamento/transporte) |
| Documentos digitalizados | certidão, RG/CPF, comprovante, laudo etc. | inclui **sensível** (laudo) | **não receber online** na 1ª versão (D5) |
| Observações | texto livre | risco de dado sensível sem controle | não oferecer campo livre online |

Pontos de atenção do cadastro **atual** (valem além do M1):
- Texto livre (`observacoes`, `condicoesSaude`) acaba recebendo dado sensível sem estrutura.
  Proposta: orientar na tela e revisar a necessidade de cada campo.
- `corRaca` e saúde estão no mesmo registro que dados de contato; o escopo por escola e a
  minimização para professor (`lib/minimizacao.ts`) já restringem quem vê, mas o professor
  **vê** saúde e contato de emergência, por decisão anterior (segurança em sala).

## 4. Finalidades e bases legais (proposta para validação jurídica)

| Tratamento | Finalidade | Base legal proposta |
|---|---|---|
| Pré-matrícula e matrícula | acesso à educação básica pública | art. 7º, III e art. 23 (políticas públicas / competência legal do ente) `[CONFERIR]` |
| Dados sensíveis (saúde, deficiência, cor/raça) | atendimento educacional, AEE, segurança do aluno, Censo | art. 11, II, "b" (execução de políticas públicas pela administração) `[CONFERIR]` |
| Crianças e adolescentes | todas as acima | art. 14 — **melhor interesse**; a ANPD admite outras bases além do consentimento parental para dados de crianças `[CONFERIR: Enunciado CD/ANPD nº 1/2023]` |
| Envio ao INEP (Educacenso) | censo escolar obrigatório | cumprimento de obrigação legal/regulatória `[CONFERIR norma do Censo Escolar]` |
| Envio ao MEC (Sistema Presença) | acompanhamento da frequência do Bolsa Família | `[CONFERIR norma do programa]` |
| Histórico escolar | escrituração escolar, transferência, conclusão | obrigação legal/regulatória `[CONFERIR: LDB e normas estaduais]` |

Não há, nem é proposto, uso para marketing, perfilamento ou decisão automatizada (art. 20).

## 5. Matrícula online — riscos e controles

| Risco | Controle proposto | Situação |
|---|---|---|
| Formulário público atacado por robôs / spam / enumeração | limite por IP (o sistema já usa rate limit), tamanho máximo, validação por schema, rota que só **cria** e nunca devolve dados já cadastrados | a construir; CAPTCHA depende de D7 |
| Revelar que uma criança já está matriculada (vazamento por "já existe") | resposta sempre igual ("pedido recebido, protocolo X"); conferência de duplicidade só pela secretaria | a construir |
| Pessoa sem vínculo preenche dados de uma criança | pedido fica "pendente" até conferência presencial dos documentos (D6); nenhum acesso ao portal antes disso | a construir |
| Upload público de documentos (malware, dado sensível exposto) | 1ª versão sem upload (D5); se houver: tipos/tamanho já limitados no módulo atual, varredura antivírus `[PREENCHER: ferramenta]` | decisão |
| Falta de transparência na coleta | aviso de privacidade no próprio formulário (finalidade, base, prazo, encarregado — art. 9º) e link da política oficial | depende de D1 e da URL `[PREENCHER]` |
| Rastreamento de terceiros | formulário sem analytics, pixels ou fontes externas que registrem acesso | a construir (o painel atual não usa analytics) |
| Pré-matrículas esquecidas | expurgo automático após o prazo D8, com registro na auditoria | a construir |
| Confirmação por e-mail/SMS | depende do M9 (provedores ainda não escolhidos); o conteúdo não deve conter dado do aluno além do protocolo | adiado |

## 6. Histórico escolar — riscos e controles

- **Conteúdo:** anos, escolas, séries, componentes, notas/médias, frequência, situação final,
  transferências. As médias usam a mesma regra do boletim (`lib/media.ts`, escala 0–10).
- **Acesso:** secretaria da escola e SEMEC; o responsável veria pelo portal/app `[decisão]`.
  O professor **não** precisa do histórico completo.
- **Integridade e retificação (art. 18, III):** correção só por perfil autorizado, com motivo e
  registro na auditoria (quem, quando, o que mudou). O documento emitido deve identificar a versão.
- **Autenticidade do documento emitido:** D9. Sem definição, o sistema não deve emitir histórico
  "oficial" — só relatório interno.
- **Retenção:** longa (D10), separada do expurgo de documentos digitalizados.
- **Transferência para outra rede:** envio só do necessário, por canal definido `[PREENCHER]`.

## 7. Direitos dos titulares (art. 18)

| Direito | Hoje | Lacuna |
|---|---|---|
| Confirmação e acesso | tela "Privacidade e seus dados" nos apps (`/api/portal/meu/dados`) mostra o que se guarda do **usuário** | não há relatório do que se guarda do **aluno** para o responsável |
| Correção | pela secretaria da escola | sem registro formal do pedido |
| Eliminação | expurgo de documentos (`LGPD_RETENCAO.md`); exclusão de matrícula restrita à gestão | dados de matrícula ativa não são elimináveis por obrigação legal — explicar no aviso |
| Informação sobre compartilhamento | não exibida | listar INEP e MEC no aviso de privacidade |
| Canal | — | D1/D11 |

## 8. Segurança (art. 46) — o que já existe e o que falta

Já implementado (verificado em testes e na validação no navegador em 26–27/09):
- sessão do painel só em cookie `httpOnly` + CSRF; app com tokens no armazenamento seguro do aparelho;
- autorização no servidor com negação por padrão (RBAC) e **escopo por escola/turma** na camada de dados;
- minimização de resposta para professor (sem CPF, NIS, endereço, contatos do responsável);
- responsável/usuário sem função só leem o próprio portal (correção do achado 27);
- auditoria de login, sessão, download/exclusão/expurgo de documentos e exportações (`lib/auditoria.ts`);
- validação de entrada com schema; HTTPS obrigatório para o app em produção.

Lacunas conhecidas:
- **não há registro de leitura** de ficha de aluno (quem abriu os dados de saúde de qual criança). Proposta: auditar leitura de matrícula individual e de dados sensíveis `[decisão de escopo]`;
- criptografia em repouso e backups dependem do provedor (D3) — backup precisa ter rotação para que o expurgo alcance as cópias;
- plano de resposta a incidente (D12);
- relatório de impacto (RIPD, art. 38): este documento pode servir de base `[PREENCHER: se a ANPD/procuradoria exigir o formato próprio]`.

## 9. Retenção proposta

| Dado | Prazo | Base |
|---|---|---|
| Pré-matrícula não efetivada | `[PREENCHER]` (D8) | minimização |
| Matrícula (cadastro) | enquanto houver vínculo + `[PREENCHER]` | escrituração |
| Documentos digitalizados | ver `LGPD_RETENCAO.md` | — |
| Histórico escolar | `[PREENCHER]` (D10) | escrituração `[CONFERIR]` |
| Trilha de auditoria | `[PREENCHER]` | segurança / prestação de contas |

## 10. Checklist antes de construir o M1

- [ ] D1–D12 respondidas (e D13, que não bloqueia o M1)
- [ ] Texto do aviso de privacidade do formulário aprovado pela Prefeitura
- [ ] Campos da matrícula online fechados a partir da §3
- [ ] Prazo de expurgo das pré-matrículas definido e automatizado
- [ ] Auditoria de leitura de dados sensíveis decidida
- [ ] Hospedagem e backups definidos (D3)
- [ ] Testes de segurança do formulário público (limites, enumeração, schema) no CI
