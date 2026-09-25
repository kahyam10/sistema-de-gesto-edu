import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { responsavelApi } from "../../api/endpoints";
import type { Situacao } from "../../api/types";
import { Cartao, Carregando, Erro, Rotulo, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ResponsavelStack } from "../../navigation/tipos";
import { cores, espaco, raio } from "../../theme";
import { dataBR, nota } from "../../utils/formato";

type Props = NativeStackScreenProps<ResponsavelStack, "Aluno">;

const SITUACAO: Record<Situacao, { texto: string; tom: "sucesso" | "alerta" | "perigo" | "neutro" }> = {
  APROVADO: { texto: "Aprovado", tom: "sucesso" },
  RECUPERACAO: { texto: "Recuperação", tom: "alerta" },
  REPROVADO: { texto: "Reprovado", tom: "perigo" },
  EM_CURSO: { texto: "Em curso", tom: "neutro" },
};

export function AlunoScreen({ route }: Props) {
  const { matriculaId } = route.params;
  const [aba, setAba] = useState<"boletim" | "frequencia">("boletim");

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={s.abas} accessibilityRole="tablist">
        {(["boletim", "frequencia"] as const).map((a) => (
          <Pressable
            key={a}
            onPress={() => setAba(a)}
            accessibilityRole="tab"
            accessibilityState={{ selected: aba === a }}
            style={[s.aba, aba === a && s.abaAtiva]}
          >
            <Text style={[s.abaTexto, aba === a && { color: "#fff" }]}>{a === "boletim" ? "Boletim" : "Frequência"}</Text>
          </Pressable>
        ))}
      </View>
      {aba === "boletim" ? <Boletim matriculaId={matriculaId} /> : <Frequencia matriculaId={matriculaId} />}
    </View>
  );
}

function Boletim({ matriculaId }: { matriculaId: string }) {
  const q = useQuery({ queryKey: ["boletim", matriculaId], queryFn: () => responsavelApi.boletim(matriculaId) });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const b = q.data;
  const sit = SITUACAO[b.situacaoGeral];

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      <Cartao>
        <Subtitulo>{b.turma.serie} · {b.turma.nome}</Subtitulo>
        <Selo texto={sit.texto} tom={sit.tom} />
        <Texto suave>
          Frequência geral: {b.frequencia.percentualPresenca}% ({b.frequencia.faltas} faltas em {b.frequencia.totalAulas} aulas)
        </Texto>
        {b.frequencia.abaixoDoLimite && <Selo texto="Frequência abaixo de 75%" tom="perigo" />}
      </Cartao>
      {b.disciplinas.length === 0 ? (
        <Vazio texto="Ainda não há notas lançadas." />
      ) : (
        b.disciplinas.map((d) => (
          <Cartao key={d.disciplinaId}>
            <View style={s.cabecalho}>
              <Subtitulo>{d.disciplinaNome}</Subtitulo>
              <Selo texto={SITUACAO[d.situacao].texto} tom={SITUACAO[d.situacao].tom} />
            </View>
            <View style={s.bimestres}>
              {d.bimestres.map((bi) => (
                <View key={bi.bimestre} style={s.bimestre}>
                  <Rotulo>{bi.bimestre}º bim</Rotulo>
                  <Text style={s.notaValor}>{nota(bi.media)}</Text>
                </View>
              ))}
              <View style={[s.bimestre, s.final]}>
                <Rotulo>Média</Rotulo>
                <Text style={[s.notaValor, { color: cores.marcaEscura }]}>{nota(d.mediaFinal)}</Text>
              </View>
            </View>
          </Cartao>
        ))
      )}
    </Tela>
  );
}

const ROTULO_STATUS = { PRESENTE: "Presente", FALTA: "Falta", JUSTIFICADA: "Falta justificada" } as const;
const TOM_STATUS = { PRESENTE: "sucesso", FALTA: "perigo", JUSTIFICADA: "alerta" } as const;

function Frequencia({ matriculaId }: { matriculaId: string }) {
  const q = useQuery({ queryKey: ["frequencia", matriculaId], queryFn: () => responsavelApi.frequencia(matriculaId) });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const { estatisticas: e, registros } = q.data;

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      {!e ? (
        <Vazio texto="O aluno ainda não está enturmado." />
      ) : (
        <Cartao>
          <Text style={[s.grande, { color: e.abaixoDoLimite ? cores.perigo : cores.sucesso }]}>{e.percentualPresenca}%</Text>
          <Texto suave>
            {e.presencas} presenças · {e.faltas} faltas · {e.faltasJustificadas} justificadas · {e.totalAulas} aulas
          </Texto>
          {e.abaixoDoLimite && <Selo texto="Abaixo do mínimo de 75% — procure a escola" tom="perigo" />}
        </Cartao>
      )}
      {registros.length > 0 && <Rotulo>Registros</Rotulo>}
      {[...registros]
        .sort((a, b) => b.data.localeCompare(a.data))
        .slice(0, 60)
        .map((r) => (
          <View key={r.id} style={s.registro}>
            <Texto>{dataBR(r.data)}</Texto>
            <Selo texto={ROTULO_STATUS[r.status]} tom={TOM_STATUS[r.status]} />
          </View>
        ))}
    </Tela>
  );
}

const s = StyleSheet.create({
  abas: { flexDirection: "row", gap: espaco.sm, padding: espaco.lg, paddingBottom: 0 },
  aba: { flex: 1, paddingVertical: 10, borderRadius: raio.sm, alignItems: "center", backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  abaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  abaTexto: { fontWeight: "600", color: cores.texto },
  cabecalho: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: espaco.sm },
  bimestres: { flexDirection: "row", gap: espaco.sm },
  bimestre: { flex: 1, alignItems: "center", paddingVertical: espaco.sm, borderRadius: raio.sm, backgroundColor: cores.fundo, gap: 2 },
  final: { backgroundColor: cores.marcaSuave },
  notaValor: { fontSize: 17, fontWeight: "700", color: cores.texto },
  grande: { fontSize: 36, fontWeight: "800" },
  registro: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: cores.superficie,
    padding: espaco.md, borderRadius: raio.sm, borderWidth: 1, borderColor: cores.borda,
  },
});
