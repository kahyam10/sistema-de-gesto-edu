import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { responsavelApi } from "../../api/endpoints";
import type { Boletim as TBoletim, FrequenciaAluno, Situacao } from "../../api/types";
import {
  Avatar, Aviso, Barra, Cabecalho, Cartao, Carregando, Erro, Estatistica, Segmentos, Selo, Subtitulo, Tela, Texto, Titulo, Tom, Vazio,
} from "../../components/ui";
import type { ResponsavelStack } from "../../navigation/tipos";
import { cores, espaco, fontes, LIMITE_PRESENCA, raio } from "../../theme";
import { capitalizar, diaDaSemana, diaMes, nota } from "../../utils/formato";
import {
  descricaoAula,
  mediaDaDisciplina,
  mediaGeralDoAluno,
  ordenarRegistros,
  rotuloMedia,
  textoFrequenciaDisciplina,
  textoMedia,
} from "../../utils/medias";

type Props = NativeStackScreenProps<ResponsavelStack, "Aluno">;
type Aba = "boletim" | "frequencia";

const SITUACAO: Record<Situacao, { texto: string; tom: Tom }> = {
  APROVADO: { texto: "Aprovado", tom: "sucesso" },
  RECUPERACAO: { texto: "Recuperação", tom: "alerta" },
  REPROVADO: { texto: "Reprovado", tom: "perigo" },
  EM_CURSO: { texto: "Em curso", tom: "marca" },
};

export function AlunoScreen({ route, navigation }: Props) {
  const { matriculaId, nomeAluno } = route.params;
  const [aba, setAba] = useState<Aba>("boletim");
  // Dados de turma/escola já vieram na lista de alunos (mesmo cache)
  const alunos = useQuery({ queryKey: ["meus-alunos"], queryFn: responsavelApi.alunos });
  const m = alunos.data?.find((v) => v.matricula.id === matriculaId)?.matricula;

  const boletim = useQuery({ queryKey: ["boletim", matriculaId], queryFn: () => responsavelApi.boletim(matriculaId) });
  const frequencia = useQuery({
    queryKey: ["frequencia", matriculaId],
    queryFn: () => responsavelApi.frequencia(matriculaId),
    enabled: aba === "frequencia",
  });

  const atual = aba === "boletim" ? boletim : frequencia;
  const linhas = [
    m?.turma ? `${m.turma.serie.nome} · Turma ${m.turma.nome} · ${capitalizar(m.turma.turno)}` : null,
    m ? `${m.escola.nome} · Matrícula ${m.numeroMatricula}` : null,
  ].filter(Boolean).join("\n");

  return (
    <Tela
      atualizando={atual.isRefetching}
      aoAtualizar={() => atual.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          esquerda={<Avatar nome={nomeAluno} tamanho={56} invertido />}
          titulo={nomeAluno}
          subtitulo={linhas || undefined}
        />
      }
    >
      <Segmentos<Aba>
        rotulo="Informações do aluno"
        opcoes={[{ valor: "boletim", rotulo: "Boletim" }, { valor: "frequencia", rotulo: "Frequência" }]}
        valor={aba}
        aoMudar={setAba}
      />
      {aba === "boletim" ? <Boletim q={boletim} /> : <Frequencia q={frequencia} />}
    </Tela>
  );
}

function Boletim({ q }: { q: UseQueryResult<TBoletim> }) {
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const b = q.data;
  const sit = SITUACAO[b.situacaoGeral];
  const geral = mediaGeralDoAluno(b);

  return (
    <>
      <Cartao style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ gap: 4, flex: 1 }}>
          <Texto pequeno suave>{b.turma.serie} · {b.turma.nome}</Texto>
          <Subtitulo>{rotuloMedia(geral, "Média geral")}</Subtitulo>
          <Selo texto={sit.texto} tom={sit.tom} />
        </View>
        <Text style={s.mediaGrande}>{nota(geral.valor)}</Text>
      </Cartao>
      {b.disciplinas.length === 0 ? (
        <Vazio texto="Ainda não há notas lançadas." />
      ) : (
        b.disciplinas.map((d) => {
          const md = mediaDaDisciplina(d);
          return (
            <Cartao key={d.disciplinaId}>
              <View style={s.linhaTopo}>
                <View style={{ flex: 1 }}><Subtitulo>{d.disciplinaNome}</Subtitulo></View>
                <Selo texto={textoMedia(md)} tom={d.situacao === "EM_CURSO" ? "marca" : SITUACAO[d.situacao].tom} />
              </View>
              <View style={s.bimestres}>
                {[1, 2, 3, 4].map((n) => {
                  const bi = d.bimestres.find((x) => x.bimestre === n);
                  const v = bi?.media ?? null;
                  return (
                    <View key={n} style={s.bimestre} accessible accessibilityLabel={`${n}º bimestre: ${v === null ? "sem nota" : nota(v)}`}>
                      <Text style={s.bimRotulo}>{n}º bim</Text>
                      <Text style={[s.bimValor, v === null && { color: cores.textoApagado }]}>{nota(v)}</Text>
                    </View>
                  );
                })}
              </View>
              <Texto pequeno suave>{textoFrequenciaDisciplina(d)}</Texto>
            </Cartao>
          );
        })
      )}
      <Texto pequeno suave centro>Notas lançadas pelos professores. As médias são parciais até o fechamento do ano letivo.</Texto>
    </>
  );
}

const STATUS = {
  PRESENTE: { texto: "Presente", tom: "sucesso" },
  FALTA: { texto: "Falta", tom: "perigo" },
  JUSTIFICADA: { texto: "Falta justificada", tom: "alerta" },
} as const;

function Frequencia({ q }: { q: UseQueryResult<FrequenciaAluno> }) {
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const { estatisticas: e, registros } = q.data;
  if (!e) return <Vazio texto="O aluno ainda não está enturmado." />;

  const baixo = e.totalAulas > 0 && e.abaixoDoLimite;
  // Frequência por aula: vários registros no mesmo dia (cada um com hora e disciplina)
  const ultimos = ordenarRegistros(registros).slice(0, 20);

  return (
    <>
      <Cartao>
        <View style={s.linhaTopo}>
          <View style={{ gap: 4 }}>
            <Texto pequeno suave>Presença no ano</Texto>
            <Text style={[s.pctGrande, { color: baixo ? cores.perigoTexto : cores.sucesso }]}>
              {e.totalAulas ? `${e.percentualPresenca}%` : "—"}
            </Text>
          </View>
          <Texto pequeno suave>{e.totalAulas} aulas{"\n"}registradas</Texto>
        </View>
        <Barra percentual={e.percentualPresenca} cor={baixo ? cores.perigo : cores.sucesso} marcador={LIMITE_PRESENCA} altura={12} />
        <Texto pequeno suave>A linha marca o mínimo de {LIMITE_PRESENCA}% de presença.</Texto>
        <View style={{ flexDirection: "row", gap: espaco.sm }}>
          <Estatistica tom="sucesso" valor={e.presencas} rotulo="Presenças" />
          <Estatistica tom="perigo" valor={e.faltas} rotulo="Faltas" />
          <Estatistica tom="alerta" valor={e.faltasJustificadas} rotulo="Justificadas" />
        </View>
      </Cartao>
      {baixo ? <Aviso tom="perigo" texto="A frequência está abaixo do mínimo. Converse com a coordenação da escola." /> : null}
      {ultimos.length > 0 ? <Titulo>Últimos registros</Titulo> : null}
      {ultimos.map((r) => {
        const aula = descricaoAula(r);
        return (
          <View key={r.id} style={s.registro}>
            <View style={{ flex: 1 }}>
              <Text style={s.regData}>{diaMes(r.data)}</Text>
              <Texto pequeno suave>{diaDaSemana(r.data)}</Texto>
              {aula ? <Texto pequeno>{aula}</Texto> : null}
            </View>
            <Selo texto={STATUS[r.status].texto} tom={STATUS[r.status].tom} />
          </View>
        );
      })}
    </>
  );
}

const s = StyleSheet.create({
  mediaGrande: { fontFamily: fontes.titulo, fontSize: 40, lineHeight: 46, color: cores.marcaEscura },
  linhaTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: espaco.sm },
  bimestres: { flexDirection: "row", gap: 6 },
  bimestre: { flex: 1, alignItems: "center", paddingVertical: espaco.sm, borderRadius: 10, backgroundColor: cores.fundo, gap: 2 },
  bimRotulo: { fontFamily: fontes.regular, fontSize: 12, color: cores.textoSuave },
  bimValor: { fontFamily: fontes.negrito, fontSize: 18, color: cores.texto },
  pctGrande: { fontFamily: fontes.titulo, fontSize: 46, lineHeight: 52 },
  registro: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: cores.superficie,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda,
  },
  regData: { fontFamily: fontes.negrito, fontSize: 16, color: cores.texto },
});
