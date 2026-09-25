import { StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import {
  Aviso, Botao, Cabecalho, Cartao, Carregando, Erro, Estatistica, Selo, Subtitulo, Tela, Texto, Titulo, TopoCabecalho,
} from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, fontes } from "../../theme";
import { dataPorExtenso, hojeISO, saudacao } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Inicio">;

export function InicioProfessorScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const { profissional, turmas, aulasHoje, frequenciasPendentesHoje } = q.data;
  const pendentes = new Set(frequenciasPendentesHoje.map((p) => p.turmaId));
  const turmaPorId = new Map(turmas.map((t) => [t.id, t]));
  const escolas = [...new Set(turmas.map((t) => t.escola.nome))];
  const disciplinas = [...new Set(turmas.map((t) => t.disciplina).filter((d): d is string => !!d))];

  return (
    <Tela
      sobrepor
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={
        <Cabecalho
          sobreposto
          topo={<TopoCabecalho direita={dataPorExtenso(hojeISO())} />}
          titulo={`${saudacao()}, ${profissional.nome.split(" ")[0]}`}
          subtitulo={[escolas.join(", "), disciplinas.join(", ")].filter(Boolean).join(" · ") || undefined}
        />
      }
    >
      <Cartao style={{ flexDirection: "row", gap: espaco.sm }}>
        <Estatistica destaque valor={aulasHoje.length} rotulo="Aulas hoje" />
        <Estatistica
          destaque
          valor={pendentes.size}
          rotulo="Chamadas pendentes"
          tom={pendentes.size > 0 ? "alerta" : "sucesso"}
        />
      </Cartao>

      <Titulo>Aulas de hoje</Titulo>
      {aulasHoje.length === 0 ? (
        <Texto suave>Nenhuma aula na sua grade hoje. As turmas estão na aba Turmas.</Texto>
      ) : (
        aulasHoje.map((a) => {
          const pendente = pendentes.has(a.turmaId);
          const turma = turmaPorId.get(a.turmaId);
          return (
            <Cartao key={`${a.turmaId}-${a.horaInicio}`} style={{ flexDirection: "row", gap: 14 }}>
              <View style={s.horario}>
                <Text style={s.hora}>{a.horaInicio}</Text>
                <Text style={s.horaFim}>{a.horaFim}</Text>
              </View>
              <View style={{ flex: 1, gap: 10 }}>
                <View style={{ gap: 2 }}>
                  <Subtitulo>Turma {a.turmaNome}</Subtitulo>
                  <Texto pequeno suave>
                    {a.disciplina}{turma ? ` · ${turma.totalAlunosAtivos} alunos` : ""}
                  </Texto>
                </View>
                <Selo texto={pendente ? "Chamada pendente" : "Chamada feita"} tom={pendente ? "alerta" : "sucesso"} />
                <Botao
                  compacto
                  titulo={pendente ? "Fazer chamada" : "Revisar chamada"}
                  variante={pendente ? "primario" : "secundario"}
                  onPress={() => navigation.navigate("Chamada", { turmaId: a.turmaId, turmaNome: a.turmaNome })}
                />
              </View>
            </Cartao>
          );
        })
      )}
      {aulasHoje.length > 0 && pendentes.size === 0 ? <Aviso texto="Todas as chamadas de hoje foram registradas." /> : null}
    </Tela>
  );
}

const s = StyleSheet.create({
  horario: { alignItems: "center", minWidth: 52, paddingRight: 14, borderRightWidth: 1, borderRightColor: cores.borda, gap: 2 },
  hora: { fontFamily: fontes.negrito, fontSize: 17, color: cores.texto },
  horaFim: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave },
});
