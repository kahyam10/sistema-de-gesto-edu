#!/bin/bash

# Script de Teste Automatizado - Módulo 4, 5 e 9
# Sistema de Gestão Educacional - Ibirapitanga-BA

BASE_URL="http://localhost:3333"
RESULTS_FILE="test-results.md"

echo "# 🧪 Resultados dos Testes Automatizados" > $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "**Data**: $(date '+%Y-%m-%d %H:%M:%S')" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logar resultados
log_test() {
    local status=$1
    local test_name=$2
    local details=$3

    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        echo "- ✅ **PASS**: $test_name" >> $RESULTS_FILE
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name"
        echo "- ❌ **FAIL**: $test_name" >> $RESULTS_FILE
        echo "  - Detalhes: $details" >> $RESULTS_FILE
    fi
}

echo ""
echo "=========================================="
echo "  TESTES AUTOMATIZADOS - MÓDULO 4, 5, 9"
echo "=========================================="
echo ""

# ============================================
# PASSO 1: AUTENTICAÇÃO
# ============================================
echo -e "${YELLOW}[1/10]${NC} Testando autenticação..."
echo "" >> $RESULTS_FILE
echo "## 1. Autenticação" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ibirapitanga.ba.gov.br",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    log_test "PASS" "Login com credenciais admin" "Token obtido com sucesso"
    echo "Token: ${TOKEN:0:50}..." >> $RESULTS_FILE
else
    log_test "FAIL" "Login com credenciais admin" "Falha ao obter token: $LOGIN_RESPONSE"
    echo "⛔ Testes abortados - falha na autenticação"
    exit 1
fi

# ============================================
# PASSO 2: OBTER IDs DO BANCO
# ============================================
echo ""
echo -e "${YELLOW}[2/10]${NC} Obtendo IDs de profissionais, escolas e matrículas..."
echo "" >> $RESULTS_FILE
echo "## 2. Obtenção de IDs de Referência" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Listar profissionais
PROF_RESPONSE=$(curl -s -X GET "$BASE_URL/api/profissionais" \
  -H "Authorization: Bearer $TOKEN")

# Tentar extrair primeiro ID
PROF_ID=$(echo $PROF_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$PROF_ID" ]; then
    log_test "PASS" "Listar profissionais e obter ID" "ID obtido: $PROF_ID"
else
    # Tentar via paginação
    PROF_RESPONSE=$(curl -s -X GET "$BASE_URL/api/profissionais?page=1&limit=10" \
      -H "Authorization: Bearer $TOKEN")
    PROF_ID=$(echo $PROF_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$PROF_ID" ]; then
        log_test "PASS" "Listar profissionais (paginado) e obter ID" "ID obtido: $PROF_ID"
    else
        log_test "FAIL" "Listar profissionais" "Resposta: ${PROF_RESPONSE:0:200}"
        echo "⚠️  Continuando com testes limitados..."
    fi
fi

# Listar escolas
ESCOLA_RESPONSE=$(curl -s -X GET "$BASE_URL/api/escolas" \
  -H "Authorization: Bearer $TOKEN")

ESCOLA_ID=$(echo $ESCOLA_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$ESCOLA_ID" ]; then
    log_test "PASS" "Listar escolas e obter ID" "ID obtido: $ESCOLA_ID"
else
    log_test "FAIL" "Listar escolas" "Resposta: ${ESCOLA_RESPONSE:0:200}"
fi

# Listar matrículas
MAT_RESPONSE=$(curl -s -X GET "$BASE_URL/api/matriculas?page=1&limit=5" \
  -H "Authorization: Bearer $TOKEN")

MAT_ID=$(echo $MAT_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$MAT_ID" ]; then
    log_test "PASS" "Listar matrículas e obter ID" "ID obtido: $MAT_ID"
else
    log_test "FAIL" "Listar matrículas" "Resposta: ${MAT_RESPONSE:0:200}"
fi

# ============================================
# PASSO 3: MÓDULO 4 - PONTO DIGITAL
# ============================================
echo ""
echo -e "${YELLOW}[3/10]${NC} Testando CRUD de Ponto Digital..."
echo "" >> $RESULTS_FILE
echo "## 3. Módulo 4 - Ponto Digital" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

if [ -n "$PROF_ID" ]; then
    # Criar registro de ponto
    PONTO_CREATE=$(curl -s -X POST "$BASE_URL/api/ponto" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"profissionalId\": \"$PROF_ID\",
        \"data\": \"2026-02-15\",
        \"tipoRegistro\": \"NORMAL\",
        \"entrada\": \"08:00\",
        \"saida\": \"17:00\",
        \"observacao\": \"Teste automatizado - registro de ponto\"
      }")

    PONTO_ID=$(echo $PONTO_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$PONTO_ID" ]; then
        log_test "PASS" "POST /api/ponto - Criar registro" "Ponto criado: $PONTO_ID"

        # Listar pontos
        PONTO_LIST=$(curl -s -X GET "$BASE_URL/api/ponto?page=1&limit=10" \
          -H "Authorization: Bearer $TOKEN")

        if echo "$PONTO_LIST" | grep -q "$PONTO_ID"; then
            log_test "PASS" "GET /api/ponto - Listar registros" "Ponto criado encontrado na listagem"
        else
            log_test "FAIL" "GET /api/ponto - Listar registros" "Ponto criado não encontrado"
        fi

        # Aprovar ponto
        PONTO_APPROVE=$(curl -s -X PATCH "$BASE_URL/api/ponto/$PONTO_ID/status" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d '{
            "status": "APROVADO",
            "observacao": "Teste automatizado - aprovação"
          }')

        if echo "$PONTO_APPROVE" | grep -q "APROVADO"; then
            log_test "PASS" "PATCH /api/ponto/:id/status - Aprovar" "Status alterado com sucesso"
        else
            log_test "FAIL" "PATCH /api/ponto/:id/status - Aprovar" "Resposta: ${PONTO_APPROVE:0:200}"
        fi

    else
        log_test "FAIL" "POST /api/ponto - Criar registro" "Resposta: ${PONTO_CREATE:0:200}"
    fi
else
    echo "⚠️  Pulando testes de ponto - sem ID de profissional"
fi

# ============================================
# PASSO 4: MÓDULO 4 - LICENÇAS
# ============================================
echo ""
echo -e "${YELLOW}[4/10]${NC} Testando CRUD de Licenças..."
echo "" >> $RESULTS_FILE
echo "## 4. Módulo 4 - Licenças" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

if [ -n "$PROF_ID" ]; then
    # Criar licença
    LICENCA_CREATE=$(curl -s -X POST "$BASE_URL/api/licencas" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d "{
        \"profissionalId\": \"$PROF_ID\",
        \"tipo\": \"MEDICA\",
        \"dataInicio\": \"2026-02-20\",
        \"dataFim\": \"2026-02-25\",
        \"diasCorridos\": 6,
        \"motivo\": \"Teste automatizado - licença médica\"
      }")

    LICENCA_ID=$(echo $LICENCA_CREATE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -n "$LICENCA_ID" ]; then
        log_test "PASS" "POST /api/licencas - Criar licença" "Licença criada: $LICENCA_ID"

        # Listar licenças
        LICENCA_LIST=$(curl -s -X GET "$BASE_URL/api/licencas?status=PENDENTE" \
          -H "Authorization: Bearer $TOKEN")

        if echo "$LICENCA_LIST" | grep -q "$LICENCA_ID"; then
            log_test "PASS" "GET /api/licencas - Listar licenças" "Licença encontrada"
        else
            log_test "FAIL" "GET /api/licencas - Listar licenças" "Licença não encontrada"
        fi

        # Aprovar licença
        ADMIN_ID="cmln23unb0000isumnxuf5c0z"
        LICENCA_APPROVE=$(curl -s -X PATCH "$BASE_URL/api/licencas/$LICENCA_ID/status" \
          -H "Authorization: Bearer $TOKEN" \
          -H "Content-Type: application/json" \
          -d "{
            \"status\": \"APROVADA\",
            \"observacao\": \"Teste automatizado - aprovação\",
            \"aprovadaPor\": \"$ADMIN_ID\"
          }")

        if echo "$LICENCA_APPROVE" | grep -q "APROVADA"; then
            log_test "PASS" "PATCH /api/licencas/:id/status - Aprovar" "Licença aprovada"
        else
            log_test "FAIL" "PATCH /api/licencas/:id/status - Aprovar" "Resposta: ${LICENCA_APPROVE:0:200}"
        fi

    else
        log_test "FAIL" "POST /api/licencas - Criar licença" "Resposta: ${LICENCA_CREATE:0:200}"
    fi
else
    echo "⚠️  Pulando testes de licenças - sem ID de profissional"
fi

# ============================================
# RESUMO FINAL
# ============================================
echo ""
echo "=========================================="
echo "  TESTES CONCLUÍDOS"
echo "=========================================="
echo ""
echo "📄 Relatório completo salvo em: $RESULTS_FILE"
echo ""

# Contar sucessos e falhas
TOTAL_PASS=$(grep -c "✅ \*\*PASS\*\*" $RESULTS_FILE)
TOTAL_FAIL=$(grep -c "❌ \*\*FAIL\*\*" $RESULTS_FILE)

echo "" >> $RESULTS_FILE
echo "---" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "## Resumo Final" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE
echo "- ✅ **Testes aprovados**: $TOTAL_PASS" >> $RESULTS_FILE
echo "- ❌ **Testes falhados**: $TOTAL_FAIL" >> $RESULTS_FILE
echo "- 📊 **Taxa de sucesso**: $(awk "BEGIN {printf \"%.1f\", ($TOTAL_PASS/($TOTAL_PASS+$TOTAL_FAIL))*100}")%" >> $RESULTS_FILE

echo -e "${GREEN}✅ $TOTAL_PASS testes passaram${NC}"
echo -e "${RED}❌ $TOTAL_FAIL testes falharam${NC}"
