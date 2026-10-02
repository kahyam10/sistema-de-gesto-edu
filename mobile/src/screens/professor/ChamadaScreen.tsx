import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import type { StatusFrequencia } from "../../api/types";
import { Aviso, Botao, Cabecalho, Carregando, Erro, Estatistica, Tela, Texto, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, fontes, raio } from "../../theme";
import { dataPorExtenso, hojeISO, horaBR } from "../../utils/formato";
import { aulaPreSelecionada, horaAtualNaRede } from "../../utils/chamada";

type Props = NativeStackScreenProps<ProfessorStack, "Chamada">;

const OPCOES: Array<{ valor: StatusFrequencia; letra: string; nome: string; cor: string }> = [
  { valor: "PRESENTE", letra: "P", nome: "Presente", cor: cores.sucesso },
  { valor: "FALTA", letra: "F", nome: "Falta", cor: cores.perigo },
  { valor: "JUSTIFICADA", letra: "J", nome: "Falta justificada", cor: cores.alerta },
];

export function ChamadaScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome, gradeHorariaId: aulaDoParametro } = route.params;
  const data = hojeISO();
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["chamada", turmaId, data], queryFn: () => professorApi.chamada(turmaId, data) });
  const [marcacoes, setMarcacoes] = useState<Record<string, StatusFrequencia>>({});
  const [salvoAgora, setSalvoAgora] = useState(false);
  // Frequência por aula: aula escolhida (null = ainda não escolhida)
  const [aulaEscolhida, setAulaEscolhida] = useState<string | null>(null);
  // Hora da rede ao abrir a tela: a pré-seleção não muda sozinha enquanto o
  // professor marca (virar o minuto não troca a aula nem apaga as marcações)
  const [horaAoAbrir] = useState(() => horaAtualNaRede());

  // Turma com grade hoje → uma chamada por aula. Sem escolha explícita, abre a
  // aula pedida (vinda de "Hoje") ou a atual/próxima pelo horário da rede.
  const porAula = q.data?.modo === "AULA";
  const aulas = useMemo(() => q.data?.aulas ?? [], [q.data]);
  const aulaId = !porAula
    ? null
    : aulaEscolhida && aulas.some((a) => a.gradeHorariaId === aulaEscolhida)
      ? aulaEscolhida
      : aulaDoParametro && aulas.some((a) => a.gradeHorariaId === aulaDoParametro)
        ? aulaDoParametro
        : aulaPreSelecionada(aulas, horaAoAbrir);
  const aula = aulas.find((a) => a.gradeHorariaId === aulaId) ?? null;

  // Pré-preenche: o que já foi lançado hoje (nesta aula, ou na chamada diária)
  // ou, se nada, todos presentes
  useEffect(() => {
    if (!q.data) return;
    if (q.data.modo === "AULA") {
      const daAula = new Map((aula?.registros ?? []).map((r) => [r.matriculaId, r.status]));
      setMarcacoes(Object.fromEntries(q.data.alunos.map((a) => [a.id, daAula.get(a.id) ?? "PRESENTE"])));
    } else {
      setMarcacoes(Object.fromEntries(q.data.alunos.map((a) => [a.id, a.status ?? "PRESENTE"])));
    }
  }, [q.data, aula]);

  const cont = useMemo(() => {
    const v = Object.values(marcacoes);
    return {
      P: v.filter((x) => x === "PRESENTE").length,
      F: v.filter((x) => x === "FALTA").length,
      J: v.filter((x) => x === "JUSTIFICADA").length,
    };
  }, [marcacoes]);

  const salvar = useMutation({
    mutationFn: () =>
      professorApi.salvarChamada(
        turmaId,
        data,
        Object.entries(marcacoes).map(([matriculaId, status]) => ({ matriculaId, status })),
        aula?.gradeHorariaId
      ),
    onSuccess: () => {
      setSalvoAgora(true);
      void queryClient.invalidateQueries({ queryKey: ["professor"] });
      void queryClient.invalidateQueries({ queryKey: ["chamada", turmaId, data] });
    },
    onError: (e) => Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : ""),
  });

  function marcar(id: string, status: StatusFrequencia) {
    setSalvoAgora(false);
    setMarcacoes((m) => ({ ...m, [id]: status }));
  }

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const ja = porAula ? !!aula?.jaRegistrada : q.data.jaRegistrada;
  const registradaEm = porAula ? aula?.registradaEm ?? null : q.data.registradaEm;
  // Turma com grade hoje, mas nenhuma aula deste professor (nem sem professor)
  const semAulaMinha = porAula && aulas.length === 0;

  return (
    <Tela
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo="Chamada"
          titulo={`Turma ${turmaNome}`}
          subtitulo={`${dataPorExtenso(q.data.data)}${aula ? ` · ${aula.horaInicio} ${aula.disciplina}` : ""} · ${q.data.turma.escola.nome}`}
        />
      }
      rodape={
        <>
          {salvoAgora ? <Aviso texto={`Chamada salva: ${cont.P} presentes, ${cont.F + cont.J} ausentes.`} /> : null}
          <Botao
            titulo={ja ? "Salvar correções" : aula ? `Registrar chamada de ${aula.disciplina}` : "Registrar chamada"}
            onPress={() => salvar.mutate()}
            carregando={salvar.isPending}
            desabilitado={q.data.alunos.length === 0 || (porAula && !aula)}
          />
        </>
      }
    >
      {porAula && aulas.length > 0 ? (
        <View style={{ gap: espaco.xs }}>
          <Texto pequeno suave>Aula</Texto>
          <View style={s.aulas} accessibilityRole="radiogroup" accessibilityLabel="Aula da chamada">
            {aulas.map((a) => {
              const ativa = a.gradeHorariaId === aulaId;
              return (
                <Pressable
                  key={a.gradeHorariaId}
                  onPress={() => {
                    setSalvoAgora(false);
                    setAulaEscolhida(a.gradeHorariaId);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: ativa }}
                  accessibilityLabel={`${a.horaInicio} ${a.disciplina}${a.jaRegistrada ? ", chamada feita" : ", chamada pendente"}`}
                  style={[s.aula, ativa ? s.aulaAtiva : null]}
                >
                  <Text style={[s.aulaHora, ativa ? s.aulaTextoAtivo : null]}>
                    {a.horaInicio}{a.jaRegistrada ? " ✓" : ""}
                  </Text>
                  <Text style={[s.aulaNome, ativa ? s.aulaTextoAtivo : null]} numberOfLines={1}>{a.disciplina}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {semAulaMinha ? (
        <Vazio texto="A turma tem aulas na grade hoje, mas nenhuma é sua. A chamada é feita por aula, pelo professor de cada uma." />
      ) : null}

      {ja && !salvoAgora ? (
        <Aviso
          tom="alerta"
          texto={`Chamada${aula ? ` de ${aula.disciplina}` : ""} registrada${registradaEm ? ` às ${horaBR(registradaEm)}` : ""}. Salvar de novo substitui.`}
        />
      ) : null}

      <View style={{ flexDirection: "row", gap: espaco.sm }}>
        <Estatistica centro tom="sucesso" valor={cont.P} rotulo="Presentes" />
        <Estatistica centro tom="perigo" valor={cont.F} rotulo="Faltas" />
        <Estatistica centro tom="alerta" valor={cont.J} rotulo="Justificadas" />
      </View>
      <View style={s.legendaLinha}>
        <Texto pequeno suave>P presente · F falta · J justificada</Texto>
        <Botao
          compacto
          variante="secundario"
          titulo="Todos presentes"
          onPress={() => {
            setSalvoAgora(false);
            setMarcacoes(Object.fromEntries(q.data.alunos.map((a) => [a.id, "PRESENTE" as const])));
          }}
        />
      </View>

      {semAulaMinha ? null : q.data.alunos.length === 0 ? (
        <Vazio texto="Nenhum aluno ativo nesta turma." />
      ) : (
        q.data.alunos.map((a) => (
          <View key={a.id} style={s.linha}>
            <View style={{ flex: 1, gap: 1 }}>
              <Text style={s.nome} numberOfLines={2}>{a.nomeAluno}</Text>
              <Texto pequeno suave>Matrícula {a.numeroMatricula}</Texto>
            </View>
            <View style={s.opcoes} accessibilityRole="radiogroup" accessibilityLabel={`Situação de ${a.nomeAluno}`}>
              {OPCOES.map((o) => {
                const ativo = marcacoes[a.id] === o.valor;
                return (
                  <Pressable
                    key={o.valor}
                    onPress={() => marcar(a.id, o.valor)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={`${a.nomeAluno}: ${o.nome}`}
                    style={[s.opcao, ativo ? { backgroundColor: o.cor, borderColor: o.cor } : null]}
                  >
                    <Text style={[s.opcaoTexto, { color: ativo ? "#fff" : "#3B4642" }]}>{o.letra}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  aulas: { flexDirection: "row", flexWrap: "wrap", gap: espaco.xs },
  aula: {
    minWidth: 96, paddingVertical: espaco.xs, paddingHorizontal: espaco.sm, borderRadius: raio.sm + 2,
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCampo, gap: 1,
  },
  aulaAtiva: { backgroundColor: cores.marca, borderColor: cores.marca },
  aulaHora: { fontFamily: fontes.negrito, fontSize: 15, color: cores.texto },
  aulaNome: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave },
  aulaTextoAtivo: { color: "#fff" },
  legendaLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: espaco.sm },
  linha: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.superficie,
    borderRadius: 14, borderWidth: 1, borderColor: cores.borda, paddingVertical: espaco.sm, paddingLeft: espaco.md, paddingRight: espaco.sm,
  },
  nome: { fontFamily: fontes.negrito, fontSize: 15, color: cores.texto },
  opcoes: { flexDirection: "row", gap: espaco.xs },
  opcao: {
    width: 44, height: 44, borderRadius: raio.sm + 2, alignItems: "center", justifyContent: "center",
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.bordaCampo,
  },
  opcaoTexto: { fontFamily: fontes.negrito, fontSize: 16 },
});
