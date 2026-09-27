import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { planejamentoApi, professorApi } from "../../api/endpoints";
import type { PlanoAula } from "../../api/types";
import {
  Botao, Cabecalho, Campo, Cartao, Carregando, Erro, Rotulo, Segmentos, Tela, Texto, Vazio,
} from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco } from "../../theme";
import { dataBR, dataBRparaISO, hojeISO } from "../../utils/formato";
import { habilidadesInvalidas, lerHabilidades } from "../../utils/planejamento";

type Props = NativeStackScreenProps<ProfessorStack, "PlanoForm">;
type Erros = Partial<Record<"disciplina" | "data" | "titulo" | "objetivos" | "habilidades", string>>;
const SEM_CONTEUDO = "";

/** Criar (sem planoId) ou editar um plano em rascunho/devolvido. */
export function PlanoFormScreen({ route, navigation }: Props) {
  const { planoId } = route.params;
  const plano = useQuery({
    queryKey: ["plano", planoId],
    queryFn: () => planejamentoApi.plano(planoId!),
    enabled: !!planoId,
  });
  if (planoId && plano.isPending) return <Tela><Carregando /></Tela>;
  if (planoId && plano.isError) return <Tela><Erro erro={plano.error} tentarDeNovo={() => plano.refetch()} /></Tela>;
  // key: remonta o formulário com os dados carregados
  return <Formulario key={plano.data?.id ?? "novo"} route={route} navigation={navigation} existente={plano.data} />;
}

function Formulario({ route, navigation, existente }: Props & { existente?: PlanoAula }) {
  const { turmaId, turmaNome } = route.params;
  const queryClient = useQueryClient();
  const notas = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const cobertura = useQuery({ queryKey: ["cobertura", turmaId], queryFn: () => planejamentoApi.cobertura(turmaId) });

  const [disciplinaId, setDisciplinaId] = useState(existente?.disciplinaId ?? "");
  const [bimestre, setBimestre] = useState(existente?.bimestre ?? 1);
  const [data, setData] = useState(dataBR(existente?.dataAula ?? hojeISO()));
  const [titulo, setTitulo] = useState(existente?.titulo ?? "");
  const [objetivos, setObjetivos] = useState(existente?.objetivos ?? "");
  const [desenvolvimento, setDesenvolvimento] = useState(existente?.desenvolvimento ?? "");
  const [recursos, setRecursos] = useState(existente?.recursos ?? "");
  const [avaliacao, setAvaliacao] = useState(existente?.avaliacao ?? "");
  const [habilidades, setHabilidades] = useState((existente?.habilidadesBncc ?? []).join(", "));
  const [conteudoId, setConteudoId] = useState(existente?.conteudoProgramaticoId ?? SEM_CONTEUDO);
  const [erros, setErros] = useState<Erros>({});

  const disciplinas = notas.data?.disciplinas ?? [];
  const conteudos =
    cobertura.data?.disciplinas.find((d) => d.disciplinaId === disciplinaId)?.conteudos.filter((c) => c.bimestre === bimestre) ?? [];

  const salvar = useMutation({
    mutationFn: async (dataAula: string) => {
      const comum = {
        bimestre, dataAula, titulo: titulo.trim(), objetivos: objetivos.trim(),
        desenvolvimento: desenvolvimento.trim(), recursos: recursos.trim(), avaliacao: avaliacao.trim(),
        habilidadesBncc: lerHabilidades(habilidades),
        conteudoProgramaticoId: conteudoId || undefined,
      };
      return existente
        ? planejamentoApi.atualizar(existente.id, { ...comum, conteudoProgramaticoId: conteudoId || "" })
        : planejamentoApi.criar({ turmaId, disciplinaId, ...comum });
    },
    onSuccess: (p) => {
      queryClient.setQueryData(["plano", p.id], p);
      void queryClient.invalidateQueries({ queryKey: ["planos", turmaId] });
      void queryClient.invalidateQueries({ queryKey: ["cobertura", turmaId] });
      navigation.replace("Plano", { planoId: p.id, turmaId, turmaNome });
    },
    onError: (e) => Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : ""),
  });

  // Validação local só para ajudar; o servidor valida de novo (schema)
  function validarESalvar() {
    const e: Erros = {};
    const iso = dataBRparaISO(data);
    const invalidas = habilidadesInvalidas(lerHabilidades(habilidades));
    if (!disciplinaId) e.disciplina = "Escolha a disciplina.";
    if (!iso) e.data = "Use o formato DD/MM/AAAA.";
    if (titulo.trim().length < 2) e.titulo = "Dê um título ao plano.";
    if (!objetivos.trim()) e.objetivos = "Informe os objetivos da aula.";
    if (invalidas.length) e.habilidades = `Código inválido: ${invalidas.join(", ")} (ex.: EF05MA01).`;
    setErros(e);
    if (Object.keys(e).length) return;
    salvar.mutate(iso!);
  }

  return (
    <Tela
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          rotuloVoltar="Cancelar e voltar"
          sobretitulo={existente ? "Editar plano de aula" : "Novo plano de aula"}
          titulo={`Turma ${turmaNome}`}
        />
      }
      rodape={<Botao titulo="Salvar rascunho" onPress={validarESalvar} carregando={salvar.isPending} />}
    >
      <Cartao style={{ gap: espaco.lg }}>
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Disciplina</Rotulo>
          {existente ? (
            <Texto negrito>{existente.disciplina.nome}</Texto>
          ) : notas.isPending ? <Carregando /> : notas.isError ? <Erro erro={notas.error} tentarDeNovo={() => notas.refetch()} /> :
            disciplinas.length === 0 ? <Vazio texto="Nenhuma disciplina cadastrada para esta turma." /> : (
            <Segmentos papel="radio" rotulo="Disciplina" colunas={2}
              opcoes={disciplinas.map((d) => ({ valor: d.id, rotulo: d.nome }))}
              valor={disciplinaId} aoMudar={(v) => { setDisciplinaId(v); setConteudoId(SEM_CONTEUDO); }} />
          )}
          {erros.disciplina ? <Texto pequeno cor={cores.perigoTexto}>{erros.disciplina}</Texto> : null}
        </View>
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Bimestre</Rotulo>
          <Segmentos papel="radio" rotulo="Bimestre" colunas={4}
            opcoes={[1, 2, 3, 4].map((b) => ({ valor: b, rotulo: `${b}º` }))}
            valor={bimestre} aoMudar={(v) => { setBimestre(v); setConteudoId(SEM_CONTEUDO); }} />
        </View>
        <Campo rotulo="Data da aula" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation"
          placeholder="DD/MM/AAAA" maxLength={10} erro={erros.data} />
        <Campo rotulo="Título" value={titulo} onChangeText={setTitulo} erro={erros.titulo} maxLength={200}
          placeholder="Ex.: Frações equivalentes" />
      </Cartao>

      {disciplinaId && conteudos.length > 0 ? (
        <Cartao style={{ gap: espaco.sm }}>
          <Rotulo>Conteúdo programático (opcional)</Rotulo>
          <Segmentos papel="radio" rotulo="Conteúdo programático" colunas={1}
            opcoes={[{ valor: SEM_CONTEUDO, rotulo: "Nenhum" }, ...conteudos.map((c) => ({ valor: c.id, rotulo: c.titulo }))]}
            valor={conteudoId} aoMudar={setConteudoId} />
        </Cartao>
      ) : null}

      <Cartao style={{ gap: espaco.lg }}>
        <Campo rotulo="Objetivos" value={objetivos} onChangeText={setObjetivos} erro={erros.objetivos}
          multiline textAlignVertical="top" style={{ minHeight: 96 }} maxLength={4000} />
        <Campo rotulo="Desenvolvimento (opcional)" value={desenvolvimento} onChangeText={setDesenvolvimento}
          multiline textAlignVertical="top" style={{ minHeight: 120 }} maxLength={8000} />
        <Campo rotulo="Recursos (opcional)" value={recursos} onChangeText={setRecursos}
          multiline textAlignVertical="top" style={{ minHeight: 72 }} maxLength={2000} />
        <Campo rotulo="Avaliação (opcional)" value={avaliacao} onChangeText={setAvaliacao}
          multiline textAlignVertical="top" style={{ minHeight: 72 }} maxLength={4000} />
        <Campo rotulo="Habilidades BNCC (opcional)" value={habilidades} onChangeText={setHabilidades}
          autoCapitalize="characters" placeholder="EF05MA01, EF05MA02" erro={erros.habilidades} />
      </Cartao>
    </Tela>
  );
}
