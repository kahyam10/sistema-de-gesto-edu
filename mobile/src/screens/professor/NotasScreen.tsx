import { useState } from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import {
  Aviso, Barra, Botao, Cabecalho, Cartao, Carregando, Erro, Rotulo, Segmentos, Selo, Subtitulo, Tela, Texto, Vazio,
} from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { espaco } from "../../theme";
import { diaMes, rotuloTipoAvaliacao } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Notas">;
const num = (v: number) => String(v).replace(".", ",");

export function NotasScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome, aviso } = route.params;
  const q = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const [disciplinaId, setDisciplinaId] = useState<string | null>(null);
  const [bimestre, setBimestre] = useState<number | null>(null);

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const { disciplinas, avaliacoes, alunos } = q.data;
  const selecionada = disciplinaId ?? disciplinas[0]?.id ?? null;
  const daDisciplina = avaliacoes.filter((a) => a.disciplinaId === selecionada);
  // Sem escolha: abre no bimestre mais recente que já tem avaliação
  const bim = bimestre ?? (daDisciplina.length ? Math.max(...daDisciplina.map((a) => a.bimestre)) : 1);
  const lista = daDisciplina.filter((a) => a.bimestre === bim);
  const nomeDisciplina = disciplinas.find((d) => d.id === selecionada)?.nome;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo="Notas e avaliações"
          titulo={`Turma ${turmaNome}`}
          subtitulo={nomeDisciplina}
        />
      }
    >
      {aviso ? <Aviso texto={aviso} /> : null}

      {disciplinas.length === 0 ? (
        <Vazio texto="Nenhuma disciplina cadastrada para a etapa desta turma." />
      ) : (
        <>
          {disciplinas.length > 1 ? (
            <View style={{ gap: espaco.sm }}>
              <Rotulo>Disciplina</Rotulo>
              <Segmentos
                papel="radio"
                rotulo="Disciplina"
                opcoes={disciplinas.map((d) => ({ valor: d.id, rotulo: d.nome }))}
                valor={selecionada ?? ""}
                aoMudar={(v) => { setDisciplinaId(v); setBimestre(null); }}
              />
            </View>
          ) : null}
          <Segmentos
            rotulo="Bimestre"
            colunas={4}
            opcoes={[1, 2, 3, 4].map((b) => ({ valor: b, rotulo: `${b}º bim` }))}
            valor={bim}
            aoMudar={setBimestre}
          />
          <Botao
            variante="tracejado"
            icone="add"
            titulo={`Nova avaliação no ${bim}º bimestre`}
            onPress={() =>
              selecionada &&
              navigation.navigate("NovaAvaliacao", { turmaId, turmaNome, disciplinaId: selecionada, bimestre: bim })
            }
          />
          {lista.length === 0 ? (
            <Cartao><Texto suave centro>Nenhuma avaliação neste bimestre.</Texto></Cartao>
          ) : (
            lista.map((a) => {
              const validas = new Set(alunos.map((x) => x.id));
              const lancadas = a.notas.filter((n) => validas.has(n.matriculaId)).length;
              const total = alunos.length;
              const completa = total > 0 && lancadas === total;
              return (
                <Cartao
                  key={a.id}
                  rotulo={`${a.nome}, ${lancadas} de ${total} notas lançadas`}
                  onPress={() => navigation.navigate("LancarNotas", { turmaId, turmaNome, avaliacaoId: a.id })}
                >
                  <View style={{ flexDirection: "row", justifyContent: "space-between", gap: espaco.sm }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Subtitulo>{a.nome}</Subtitulo>
                      <Texto pequeno suave>
                        {rotuloTipoAvaliacao[a.tipo] ?? a.tipo} · {diaMes(a.data)} · vale {num(a.valorMaximo)} · peso {num(a.peso)}
                      </Texto>
                    </View>
                    <Selo texto={completa ? "Completa" : "Pendente"} tom={completa ? "sucesso" : "alerta"} />
                  </View>
                  <Barra percentual={total ? (lancadas / total) * 100 : 0} />
                  <Texto pequeno suave>{lancadas} de {total} notas lançadas</Texto>
                </Cartao>
              );
            })
          )}
        </>
      )}
    </Tela>
  );
}
