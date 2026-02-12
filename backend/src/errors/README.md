# Sistema de Tratamento de Erros

Sistema estruturado e padronizado para tratamento de erros no backend.

## Estrutura

```
errors/
├── error-codes.json    # Mapeamento de todos os códigos de erro
├── AppError.ts         # Classes de erro customizadas
├── index.ts            # Exportações
└── README.md          # Esta documentação

middleware/
└── error-handler.ts   # Middleware global de tratamento

utils/
└── logger.ts          # Sistema de logging estruturado
```

## Categorias de Erros

### AUTH - Autenticação
- `AUTH_001`: Email ou senha inválidos
- `AUTH_002`: Token inválido ou expirado
- `AUTH_003`: Token não fornecido
- `AUTH_004`: Email já cadastrado
- `AUTH_005`: Usuário inativo

### PERM - Permissões
- `PERM_001`: Permissão insuficiente
- `PERM_002`: Role não permitido
- `PERM_003`: Recurso de outra escola
- `PERM_004`: Não é proprietário do recurso

### VAL - Validação
- `VAL_001`: Dados de entrada inválidos
- `VAL_002`: CPF inválido
- `VAL_003`: Email inválido
- `VAL_004`: Data inválida
- `VAL_005`: Horário inválido
- `VAL_006`: Arquivo inválido
- `VAL_007`: Arquivo muito grande

### NF - Not Found
- `NF_001` a `NF_016`: Recursos não encontrados (User, Escola, Matrícula, etc.)

### BIZ - Regras de Negócio
- `BIZ_001`: Turma lotada
- `BIZ_002`: Limite PCD atingido
- `BIZ_003`: CPF duplicado
- `BIZ_004`: Matrícula duplicada
- `BIZ_005`: Matrícula concluída
- `BIZ_011`: Frequência duplicada
- `BIZ_012`: Licença já processada
- etc.

### DB - Banco de Dados
- `DB_001`: Erro de conexão
- `DB_002`: Erro ao executar query
- `DB_003`: Violação de constraint única
- `DB_004`: Violação de chave estrangeira
- `DB_005`: Timeout

### FILE - Arquivos
- `FILE_001`: Erro no upload
- `FILE_002`: Arquivo não encontrado
- `FILE_003`: Erro ao deletar
- `FILE_004`: Tipo não permitido
- `FILE_005`: Arquivo corrompido

### EXT - Serviços Externos
- `EXT_001`: Erro ao comunicar
- `EXT_002`: Serviço indisponível
- `EXT_003`: Timeout

### SYS - Sistema
- `SYS_001`: Erro interno
- `SYS_002`: Serviço indisponível
- `SYS_003`: Não implementado
- `SYS_004`: Requisição muito grande
- `SYS_005`: Limite de requisições

## Como Usar

### 1. Importar as classes de erro

```typescript
import {
  NotFoundError,
  BusinessError,
  ValidationError,
  AuthenticationError,
  PermissionError,
} from "../errors/index.js";
```

### 2. Lançar erros nos services

```typescript
// Exemplo 1: Recurso não encontrado
export class MatriculaService {
  async findById(id: string) {
    const matricula = await prisma.matricula.findUnique({ where: { id } });

    if (!matricula) {
      throw new NotFoundError("NF_004"); // Matrícula não encontrada
    }

    return matricula;
  }
}

// Exemplo 2: Regra de negócio
export class TurmaService {
  async addAluno(turmaId: string, alunoId: string) {
    const turma = await prisma.turma.findUnique({
      where: { id: turmaId },
      include: { _count: { select: { matriculas: true } } },
    });

    if (!turma) {
      throw new NotFoundError("NF_005"); // Turma não encontrada
    }

    if (turma._count.matriculas >= turma.capacidadeMaxima) {
      throw new BusinessError("BIZ_001", { // Turma lotada
        turmaId,
        capacidadeMaxima: turma.capacidadeMaxima,
        quantidadeAtual: turma._count.matriculas,
      });
    }

    // Continua a lógica...
  }
}

// Exemplo 3: Validação customizada
export class PontoService {
  async registrar(data: RegistrarPontoInput) {
    if (!this.isValidHorario(data.horario)) {
      throw new ValidationError("VAL_005", { // Horário inválido
        horarioRecebido: data.horario,
        formatoEsperado: "HH:MM",
      });
    }

    // Continua a lógica...
  }

  private isValidHorario(horario: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(horario);
  }
}

// Exemplo 4: Autenticação
export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new AuthenticationError("AUTH_001"); // Email ou senha inválidos
    }

    if (!user.ativo) {
      throw new AuthenticationError("AUTH_005"); // Usuário inativo
    }

    // Gera token...
  }
}

// Exemplo 5: Permissão
export class MatriculaService {
  async update(id: string, data: UpdateMatriculaInput, userId: string) {
    const matricula = await prisma.matricula.findUnique({ where: { id } });

    if (!matricula) {
      throw new NotFoundError("NF_004");
    }

    if (matricula.status === "CONCLUIDA") {
      throw new BusinessError("BIZ_005", { // Matrícula concluída
        matriculaId: id,
        status: matricula.status,
      });
    }

    // Atualiza...
  }
}
```

### 3. Usar logger estruturado

```typescript
import { logger } from "../utils/logger.js";

// Log de informação
logger.info("Matrícula criada com sucesso", {
  matriculaId: matricula.id,
  nomeAluno: matricula.nomeAluno,
  escolaId: matricula.escolaId,
});

// Log de aviso
logger.warn("Turma próxima da capacidade máxima", {
  turmaId: turma.id,
  ocupacao: (turma._count.matriculas / turma.capacidadeMaxima) * 100,
});

// Log de erro (automático via middleware, mas pode ser manual)
try {
  await someOperation();
} catch (error) {
  logger.error("Falha ao processar operação", error as Error, {
    operacao: "createMatricula",
    parametros: { ...data },
  });
  throw error;
}

// Log de debug (apenas em desenvolvimento)
logger.debug("Processando validação", {
  campo: "cpf",
  valor: data.cpf,
});
```

## Resposta de Erro Padrão

Todos os erros retornam o seguinte formato JSON:

```json
{
  "error": {
    "code": "BIZ_001",
    "message": "Turma está lotada - capacidade máxima atingida",
    "category": "REGRA_NEGOCIO",
    "timestamp": "2026-02-11T23:30:00.000Z",
    "context": {
      "turmaId": "abc123",
      "capacidadeMaxima": 30,
      "quantidadeAtual": 30
    }
  }
}
```

## Vantagens do Sistema

1. **Rastreabilidade**: Cada erro tem um código único para rastreamento
2. **Consistência**: Formato padronizado em toda a aplicação
3. **Logging**: Sistema estruturado de logs com níveis (error, warn, info, debug)
4. **Contexto**: Possibilidade de adicionar contexto específico a cada erro
5. **Categorização**: Erros agrupados por categoria facilitam análise
6. **Internacionalização**: Fácil traduzir mensagens alterando error-codes.json
7. **Monitoramento**: Pronto para integração com ferramentas externas (Sentry, DataDog)
8. **Debugging**: Ambiente dev mostra stack traces, produção mostra apenas necessário

## Boas Práticas

1. **Sempre use códigos de erro**: Nunca lance `Error` genérico, use as classes customizadas
2. **Adicione contexto relevante**: Inclua informações úteis para debug
3. **Não exponha dados sensíveis**: Não inclua senhas, tokens, etc. no contexto
4. **Use a categoria correta**: NotFound para recursos, Business para regras, etc.
5. **Mantenha error-codes.json atualizado**: Adicione novos códigos conforme necessário
6. **Log apropriadamente**: Use níveis corretos (error, warn, info, debug)
7. **Erros operacionais vs críticos**: Business errors são operacionais, System errors não são

## Integração com Serviços Externos

O logger possui um método `sendToExternalService()` preparado para integração:

```typescript
// Em logger.ts
private sendToExternalService(entry: LogEntry) {
  // Exemplo com Sentry
  if (entry.level === LogLevel.ERROR && entry.error) {
    Sentry.captureException(new Error(entry.error.message), {
      level: 'error',
      extra: {
        code: entry.error.code,
        category: entry.error.category,
        context: entry.context,
      },
    });
  }
}
```

## Testes

```typescript
import { NotFoundError, BusinessError } from "../errors/index.js";

describe("MatriculaService", () => {
  it("deve lançar NotFoundError quando matrícula não existir", async () => {
    await expect(
      service.findById("invalid-id")
    ).rejects.toThrow(NotFoundError);
  });

  it("deve lançar BusinessError quando turma estiver lotada", async () => {
    await expect(
      service.createMatricula(data)
    ).rejects.toThrow(BusinessError);
  });
});
```
