import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { planejamentoApi } from "../../api/endpoints";
import { Botao, Cabecalho, Cartao, Carregando, Erro, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { espaco } from "../../theme";
import { dataBR } from "../../utils/formato";
import { STATUS_PLANO } from "../../utils/planejamento";

type Props = NativeStackScreenProps<ProfessorStack, "Planos">;

export function PlanosScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome } = route.params;
  const q = useQuery({ queryKey: ["planos", turmaId], queryFn: () => planejamentoApi.planos(turmaId) });
  const planos = q.data?.data ?? [];
  const devolvidos = planos.filter((p) => p.status === "DEVOLVIDO").length;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => void q.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo="Planos de aula"
          titulo={`Turma ${turmaNome}`}
          subtitulo={q.data ? `${planos.length} plano(s)${devolvidos ? ` · ${devolvidos} devolvido(s)` : ""}` : undefined}
        />
      }
      rodape={
        <Botao titulo="Novo plano de aula" icone="add" onPress={() => navigation.navigate("PlanoForm", { turmaId, turmaNome })} />
      }
    >
      {q.isPending ? <Carregando /> : q.isError ? <Erro erro={q.error} tentarDeNovo={() => q.refetch()} /> : planos.length === 0 ? (
        <Vazio texto="Você ainda não tem planos de aula nesta turma." />
      ) : (
        planos.map((p) => {
          const st = STATUS_PLANO[p.status];
          return (
            <Cartao
              key={p.id}
              onPress={() => navigation.navigate("Plano", { planoId: p.id, turmaId, turmaNome })}
              rotulo={`${p.titulo}, ${p.disciplina.nome}, aula em ${dataBR(p.dataAula)}, ${st.rotulo}`}
              style={{ gap: espaco.sm }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: espaco.sm }}>
                <View style={{ flex: 1 }}>
                  <Subtitulo linhas={2}>{p.titulo}</Subtitulo>
                </View>
                <Selo texto={st.rotulo} tom={st.tom} />
              </View>
              <Texto pequeno suave>
                {p.disciplina.nome} · {p.bimestre}º bimestre · aula em {dataBR(p.dataAula)}
              </Texto>
              {p.status === "DEVOLVIDO" && p.parecer ? (
                <Texto pequeno linhas={3}>Parecer: {p.parecer}</Texto>
              ) : null}
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}
