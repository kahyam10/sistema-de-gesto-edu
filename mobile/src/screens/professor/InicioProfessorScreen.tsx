import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Cartao, Carregando, Erro, Rotulo, Selo, Subtitulo, Tela, Texto, Titulo, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { espaco } from "../../theme";

type Props = NativeStackScreenProps<ProfessorStack, "Inicio">;

export function InicioProfessorScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const { profissional, turmas, aulasHoje, frequenciasPendentesHoje } = q.data;
  const pendentes = new Set(frequenciasPendentesHoje.map((p) => p.turmaId));

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      <Titulo>Olá, {profissional.nome.split(" ")[0]}</Titulo>

      <Rotulo>Aulas de hoje</Rotulo>
      {aulasHoje.length === 0 ? (
        <Texto suave>Nenhuma aula na grade de hoje.</Texto>
      ) : (
        aulasHoje.map((a) => (
          <Cartao
            key={`${a.turmaId}-${a.horaInicio}`}
            onPress={() => navigation.navigate("Chamada", { turmaId: a.turmaId, turmaNome: a.turmaNome })}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", gap: espaco.sm }}>
              <Subtitulo>{a.turmaNome}</Subtitulo>
              <Selo texto={`${a.horaInicio}–${a.horaFim}`} tom="marca" />
            </View>
            <Texto suave>{a.disciplina}</Texto>
            {pendentes.has(a.turmaId) && <Selo texto="Chamada pendente" tom="alerta" />}
          </Cartao>
        ))
      )}

      <Rotulo>Minhas turmas</Rotulo>
      {turmas.length === 0 ? (
        <Vazio texto="Você ainda não está vinculado(a) a nenhuma turma. Fale com a secretaria." />
      ) : (
        turmas.map((t) => (
          <Cartao key={t.id} onPress={() => navigation.navigate("Turma", { turmaId: t.id, turmaNome: t.nome })}>
            <Subtitulo>{t.nome} · {t.serie.nome}</Subtitulo>
            <Texto suave>{t.escola.nome} · {t.turno.toLowerCase()} · {t.totalAlunosAtivos} alunos</Texto>
          </Cartao>
        ))
      )}
    </Tela>
  );
}
