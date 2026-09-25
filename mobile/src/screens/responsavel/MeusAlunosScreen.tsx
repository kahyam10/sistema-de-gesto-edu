import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { responsavelApi } from "../../api/endpoints";
import { Cartao, Carregando, Erro, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ResponsavelStack } from "../../navigation/tipos";

type Props = NativeStackScreenProps<ResponsavelStack, "Alunos">;

export function MeusAlunosScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["meus-alunos"], queryFn: responsavelApi.alunos });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      {q.data.length === 0 ? (
        <Vazio texto="Nenhum aluno vinculado ao seu acesso. Procure a secretaria da escola." />
      ) : (
        q.data.map(({ matricula: m, parentesco }) => (
          <Cartao
            key={m.id}
            onPress={() => navigation.navigate("Aluno", { matriculaId: m.id, nomeAluno: m.nomeAluno })}
          >
            <Subtitulo>{m.nomeAluno}</Subtitulo>
            <Texto suave>
              {m.escola.nome}
              {m.turma ? ` · ${m.turma.serie.nome} ${m.turma.nome} (${m.turma.turno.toLowerCase()})` : " · sem turma"}
            </Texto>
            <Selo texto={parentesco ? `${parentesco} · matrícula ${m.numeroMatricula}` : `Matrícula ${m.numeroMatricula}`} />
          </Cartao>
        ))
      )}
    </Tela>
  );
}
