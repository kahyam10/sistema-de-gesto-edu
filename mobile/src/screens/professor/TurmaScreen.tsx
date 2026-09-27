import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Avatar, Cabecalho, Cartao, Carregando, Erro, NomeIcone, Tela, Texto, Titulo, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, fontes, LIMITE_PRESENCA, raio } from "../../theme";
import { capitalizar } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Turma">;

function corPresenca(p: number | null) {
  if (p === null) return cores.textoApagado;
  if (p < LIMITE_PRESENCA) return cores.perigoTexto;
  if (p < 85) return cores.alertaTexto;
  return cores.sucesso;
}

function Atalho({ icone, titulo, legenda, onPress }: { icone: NomeIcone; titulo: string; legenda: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.atalho, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={s.atalhoIcone}><Ionicons name={icone} size={22} color={cores.marca} /></View>
      <Text style={s.atalhoTitulo}>{titulo}</Text>
      <Text style={s.atalhoLegenda}>{legenda}</Text>
    </Pressable>
  );
}

export function TurmaScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome } = route.params;
  const q = useQuery({ queryKey: ["professor", "alunos", turmaId], queryFn: () => professorApi.alunos(turmaId) });
  const resumo = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo });

  const temAulaHoje = resumo.data?.aulasHoje.some((a) => a.turmaId === turmaId) ?? false;
  const pendente = resumo.data?.frequenciasPendentesHoje.some((p) => p.turmaId === turmaId) ?? false;
  const statusChamada = !resumo.data ? "…" : pendente ? "Pendente" : temAulaHoje ? "Registrada hoje" : "Sem aula hoje na grade";
  const t = q.data?.turma;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => { void q.refetch(); void resumo.refetch(); }}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo="Turma"
          titulo={turmaNome}
          subtitulo={t ? `${t.serie.nome} · ${capitalizar(t.turno)} · ${t.escola.nome}` : undefined}
        />
      }
    >
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Atalho icone="clipboard-outline" titulo="Chamada de hoje" legenda={statusChamada}
          onPress={() => navigation.navigate("Chamada", { turmaId, turmaNome })} />
        <Atalho icone="create-outline" titulo="Notas e avaliações" legenda="Lançar e acompanhar"
          onPress={() => navigation.navigate("Notas", { turmaId, turmaNome })} />
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Atalho icone="book-outline" titulo="Planos de aula" legenda="Planejar e enviar à coordenação"
          onPress={() => navigation.navigate("Planos", { turmaId, turmaNome })} />
      </View>

      {q.isPending ? <Carregando /> : q.isError ? <Erro erro={q.error} tentarDeNovo={() => q.refetch()} /> : (
        <>
          <Cartao style={{ flexDirection: "row" }}>
            <Numero valor={String(q.data.alunos.length)} rotulo="Alunos" />
            <Numero valor={q.data.frequenciaMedia === null ? "—" : `${q.data.frequenciaMedia}%`} rotulo="Frequência média" />
            <Numero valor={String(q.data.totalAbaixoDoLimite)} rotulo={`Abaixo de ${LIMITE_PRESENCA}%`} cor={q.data.totalAbaixoDoLimite ? cores.perigoTexto : undefined} />
          </Cartao>

          <Titulo>Alunos</Titulo>
          {q.data.alunos.length === 0 ? <Vazio texto="Nenhum aluno ativo nesta turma." /> : q.data.alunos.map((a) => (
            <View key={a.id} style={s.aluno}
              accessible
              accessibilityLabel={`${a.nomeAluno}, presença ${a.percentualPresenca === null ? "sem aulas registradas" : `${a.percentualPresenca}%`}`}>
              <Avatar nome={a.nomeAluno} tamanho={38} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text style={s.alunoNome}>{a.nomeAluno}</Text>
                <Texto pequeno suave>Matrícula {a.numeroMatricula}</Texto>
              </View>
              <Text style={[s.pct, { color: corPresenca(a.percentualPresenca) }]}>
                {a.percentualPresenca === null ? "—" : `${a.percentualPresenca}%`}
              </Text>
            </View>
          ))}
        </>
      )}
    </Tela>
  );
}

function Numero({ valor, rotulo, cor }: { valor: string; rotulo: string; cor?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
      <Text style={[s.numero, cor ? { color: cor } : null]}>{valor}</Text>
      <Text style={s.numeroRotulo}>{rotulo}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  atalho: {
    flex: 1, minHeight: 120, gap: 10, padding: 14, borderRadius: raio.lg,
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda,
  },
  atalhoIcone: { width: 40, height: 40, borderRadius: raio.md, backgroundColor: cores.marcaSuave, alignItems: "center", justifyContent: "center" },
  atalhoTitulo: { fontFamily: fontes.negrito, fontSize: 16, color: cores.texto },
  atalhoLegenda: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave },
  numero: { fontFamily: fontes.negrito, fontSize: 22, color: cores.marcaEscura },
  numeroRotulo: { fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave, textAlign: "center" },
  aluno: {
    flexDirection: "row", alignItems: "center", gap: espaco.md, backgroundColor: cores.superficie,
    borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, paddingHorizontal: espaco.md, paddingVertical: 10,
  },
  alunoNome: { fontFamily: fontes.negrito, fontSize: 15, color: cores.texto },
  pct: { fontFamily: fontes.negrito, fontSize: 15 },
});
