import { StyleSheet, Text, View } from "react-native";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Cabecalho, Cartao, Carregando, Erro, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, fontes, LIMITE_PRESENCA } from "../../theme";
import { capitalizar } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Turmas">;

export function TurmasScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo });
  const detalhes = useQueries({
    queries: (q.data?.turmas ?? []).map((t) => ({
      queryKey: ["professor", "alunos", t.id],
      queryFn: () => professorApi.alunos(t.id),
    })),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const { turmas } = q.data;
  const anos = [...new Set(turmas.map((t) => t.anoLetivo))].join(", ");

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => { void q.refetch(); detalhes.forEach((d) => void d.refetch()); }}
      cabecalho={
        <Cabecalho
          titulo="Minhas turmas"
          subtitulo={`${turmas.length} ${turmas.length === 1 ? "turma" : "turmas"}${anos ? ` · ano letivo ${anos}` : ""}`}
        />
      }
    >
      {turmas.length === 0 ? (
        <Vazio texto="Você ainda não está vinculado(a) a nenhuma turma. Fale com a secretaria." />
      ) : (
        turmas.map((t, i) => {
          const d = detalhes[i]?.data;
          return (
            <Cartao
              key={t.id}
              rotulo={`Abrir turma ${t.nome}`}
              onPress={() => navigation.navigate("Turma", { turmaId: t.id, turmaNome: t.nome })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: espaco.md }}>
                <View style={s.selo}><Text style={s.seloTexto} numberOfLines={1}>{t.nome}</Text></View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Subtitulo>Turma {t.nome}</Subtitulo>
                  <Texto pequeno suave>
                    {t.serie.nome} · {capitalizar(t.turno)}{t.disciplina ? ` · ${t.disciplina}` : ""}
                  </Texto>
                </View>
                <Ionicons name="chevron-forward" size={22} color={cores.textoSuave} />
              </View>
              <View style={{ flexDirection: "row", gap: espaco.sm, flexWrap: "wrap" }}>
                <Selo texto={`${t.totalAlunosAtivos} alunos`} />
                {d?.frequenciaMedia != null ? <Selo texto={`Frequência ${d.frequenciaMedia}%`} /> : null}
                {d && d.totalAbaixoDoLimite > 0 ? (
                  <Selo tom="perigo" texto={`${d.totalAbaixoDoLimite} abaixo de ${LIMITE_PRESENCA}%`} />
                ) : null}
              </View>
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  selo: {
    width: 52, height: 52, borderRadius: 14, backgroundColor: cores.marcaSuave,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 4,
  },
  seloTexto: { fontFamily: fontes.titulo, fontSize: 17, color: cores.marcaSuaveTexto },
});
