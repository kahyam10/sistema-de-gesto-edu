import { View } from "react-native";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { responsavelApi } from "../../api/endpoints";
import type { Boletim } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import {
  Aviso, Avatar, Cabecalho, Cartao, Carregando, Erro, Estatistica, Secao, Subtitulo, Tela, Texto, TopoCabecalho, Vazio,
} from "../../components/ui";
import type { ResponsavelStack } from "../../navigation/tipos";
import { cores, espaco, LIMITE_PRESENCA } from "../../theme";
import { capitalizar, dataPorExtenso, hojeISO, listaDeNomes, media, nota } from "../../utils/formato";
import { ComunicadoItem } from "./ComunicadosScreen";

type Props = NativeStackScreenProps<ResponsavelStack, "Inicio">;

/** Média parcial: por disciplina usa a final (se houver) ou a dos bimestres lançados. */
export function mediaParcial(b: Boletim): number | null {
  return media(b.disciplinas.map((d) => d.mediaFinal ?? media(d.bimestres.map((x) => x.media))));
}

/** Início do responsável: um cartão por aluno + comunicados recentes. */
export function MeusAlunosScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const alunos = useQuery({ queryKey: ["meus-alunos"], queryFn: responsavelApi.alunos });
  const comunicados = useQuery({ queryKey: ["comunicados"], queryFn: responsavelApi.comunicados });
  const boletins = useQueries({
    queries: (alunos.data ?? [])
      .filter((v) => v.matricula.turma)
      .map((v) => ({
        queryKey: ["boletim", v.matricula.id],
        queryFn: () => responsavelApi.boletim(v.matricula.id),
      })),
  });

  if (alunos.isPending) return <Carregando />;
  if (alunos.isError) return <Erro erro={alunos.error} tentarDeNovo={() => alunos.refetch()} />;

  const porMatricula = new Map(
    boletins.filter((q) => q.data).map((q) => [q.data!.matricula.id, q.data!])
  );
  const nomes = alunos.data.map((v) => v.matricula.nomeAluno);
  const recentes = (comunicados.data ?? []).slice(0, 2);

  const atualizar = () => {
    void alunos.refetch();
    void comunicados.refetch();
    boletins.forEach((b) => void b.refetch());
  };

  return (
    <Tela
      sobrepor
      atualizando={alunos.isRefetching}
      aoAtualizar={atualizar}
      cabecalho={
        <Cabecalho
          sobreposto
          topo={<TopoCabecalho direita={dataPorExtenso(hojeISO())} />}
          titulo={`Olá, ${usuario?.nome.split(" ")[0] ?? ""}`}
          subtitulo={nomes.length ? `Veja como ${listaDeNomes(nomes)} ${nomes.length > 1 ? "estão" : "está"} na escola.` : undefined}
        />
      }
    >
      {alunos.data.length === 0 ? (
        <Cartao>
          <Vazio texto="Nenhum aluno vinculado ao seu acesso. Procure a secretaria da escola." />
        </Cartao>
      ) : (
        alunos.data.map(({ matricula: m }) => {
          const b = porMatricula.get(m.id);
          const pct = b?.frequencia.totalAulas ? b.frequencia.percentualPresenca : null;
          const baixo = pct !== null && pct < LIMITE_PRESENCA;
          return (
            <Cartao
              key={m.id}
              rotulo={`Abrir ${m.nomeAluno}`}
              onPress={() => navigation.navigate("Aluno", { matriculaId: m.id, nomeAluno: m.nomeAluno })}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: espaco.md }}>
                <Avatar nome={m.nomeAluno} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Subtitulo>{m.nomeAluno}</Subtitulo>
                  <Texto pequeno suave>
                    {m.turma
                      ? `${m.turma.serie.nome} · Turma ${m.turma.nome} · ${capitalizar(m.turma.turno)}`
                      : `${m.escola.nome} · sem turma`}
                  </Texto>
                </View>
                <Ionicons name="chevron-forward" size={22} color={cores.textoSuave} />
              </View>
              {m.turma ? (
                <View style={{ flexDirection: "row", gap: espaco.sm }}>
                  <Estatistica rotulo="Frequência" valor={pct === null ? "—" : `${pct}%`} tom={pct === null ? undefined : baixo ? "perigo" : "sucesso"} />
                  <Estatistica rotulo="Média parcial" valor={b ? nota(mediaParcial(b)) : "…"} />
                </View>
              ) : null}
              {baixo ? <Aviso tom="perigo" texto={`Frequência abaixo de ${LIMITE_PRESENCA}%. Procure a escola.`} /> : null}
            </Cartao>
          );
        })
      )}

      <Secao
        titulo="Comunicados"
        acao="Ver todos"
        aoAcionar={() => navigation.getParent()?.navigate("TabComunicados" as never)}
      />
      {comunicados.isError ? (
        <Texto suave>Não foi possível carregar os comunicados.</Texto>
      ) : recentes.length === 0 ? (
        <Texto suave>{comunicados.isPending ? "Carregando…" : "Nenhum comunicado no momento."}</Texto>
      ) : (
        recentes.map((c) => (
          <ComunicadoItem key={c.id} resumo comunicado={c} onPress={() => navigation.navigate("Comunicado", { id: c.id })} />
        ))
      )}
    </Tela>
  );
}
