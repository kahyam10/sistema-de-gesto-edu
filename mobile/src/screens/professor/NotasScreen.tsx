import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Botao, Cartao, Carregando, Erro, Rotulo, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco } from "../../theme";
import { dataBR } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Notas">;

export function NotasScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome } = route.params;
  const q = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const [disciplinaId, setDisciplinaId] = useState<string | null>(null);

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const { disciplinas, avaliacoes, alunos } = q.data;
  const selecionada = disciplinaId ?? disciplinas[0]?.id ?? null;
  const daDisciplina = avaliacoes.filter((a) => a.disciplinaId === selecionada);

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      <Rotulo>Disciplina</Rotulo>
      {disciplinas.length === 0 ? (
        <Vazio texto="Nenhuma disciplina cadastrada para a etapa desta turma." />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: espaco.sm }}>
          {disciplinas.map((d) => {
            const ativa = d.id === selecionada;
            return (
              <Pressable
                key={d.id}
                onPress={() => setDisciplinaId(d.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: ativa }}
                style={[s.chip, ativa && s.chipAtivo]}
              >
                <Text style={[s.chipTexto, ativa && { color: "#fff" }]}>{d.nome}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {selecionada && (
        <>
          <Rotulo>Avaliações</Rotulo>
          {daDisciplina.length === 0 ? (
            <Texto suave>Nenhuma avaliação desta disciplina ainda.</Texto>
          ) : (
            daDisciplina.map((a) => {
              const lancadas = a.notas.length;
              return (
                <Cartao
                  key={a.id}
                  onPress={() =>
                    navigation.navigate("LancarNotas", { turmaId, turmaNome, avaliacaoId: a.id })
                  }
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: espaco.sm }}>
                    <Subtitulo>{a.nome}</Subtitulo>
                    <Selo texto={`${a.bimestre}º bim.`} tom="marca" />
                  </View>
                  <Texto suave>{dataBR(a.data)} · vale {a.valorMaximo} · peso {a.peso}</Texto>
                  <Selo
                    texto={`${lancadas}/${alunos.length} notas lançadas`}
                    tom={lancadas === alunos.length && lancadas > 0 ? "sucesso" : "alerta"}
                  />
                </Cartao>
              );
            })
          )}
          <Botao
            titulo="Nova avaliação"
            variante="secundario"
            onPress={() => navigation.navigate("NovaAvaliacao", { turmaId, turmaNome, disciplinaId: selecionada })}
          />
        </>
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda,
  },
  chipAtivo: { backgroundColor: cores.marca, borderColor: cores.marca },
  chipTexto: { color: cores.texto, fontWeight: "600" },
});
