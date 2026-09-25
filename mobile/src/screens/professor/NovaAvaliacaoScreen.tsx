import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Botao, Cabecalho, Campo, Cartao, Rotulo, Segmentos, Tela } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { espaco } from "../../theme";
import {
  dataBR, dataBRparaISO, hojeISO, lerNumero, rotuloTipoAvaliacao, TIPOS_AVALIACAO, TipoAvaliacao,
} from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "NovaAvaliacao">;
type Erros = Partial<Record<"nome" | "data" | "valorMaximo" | "peso", string>>;

export function NovaAvaliacaoScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome, disciplinaId } = route.params;
  const queryClient = useQueryClient();
  const notas = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const disciplina = notas.data?.disciplinas.find((d) => d.id === disciplinaId)?.nome;

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoAvaliacao>("PROVA");
  const [bimestre, setBimestre] = useState(route.params.bimestre);
  const [valorMaximo, setValorMaximo] = useState("10");
  const [peso, setPeso] = useState("1");
  const [data, setData] = useState(dataBR(hojeISO()));
  const [erros, setErros] = useState<Erros>({});

  const criar = useMutation({
    mutationFn: (dados: { data: string; valorMaximo: number; peso: number }) =>
      professorApi.criarAvaliacao({ nome: nome.trim(), tipo, bimestre, turmaId, disciplinaId, ...dados }),
    onSuccess: (av) => {
      void queryClient.invalidateQueries({ queryKey: ["notas", turmaId] });
      navigation.replace("LancarNotas", { turmaId, turmaNome, avaliacaoId: av.id });
    },
    onError: (e) => Alert.alert("Não foi possível criar", e instanceof Error ? e.message : ""),
  });

  // Validação local só para ajudar; o servidor valida de novo (schema)
  function validarEEnviar() {
    const e: Erros = {};
    const iso = dataBRparaISO(data);
    const vm = lerNumero(valorMaximo);
    const p = lerNumero(peso);
    if (nome.trim().length < 2) e.nome = "Informe o nome da avaliação.";
    if (!iso) e.data = "Use o formato DD/MM/AAAA.";
    if (vm === null || Number.isNaN(vm) || vm <= 0 || vm > 100) e.valorMaximo = "Entre 0 e 100.";
    if (p === null || Number.isNaN(p) || p <= 0 || p > 10) e.peso = "Entre 0 e 10.";
    setErros(e);
    if (Object.keys(e).length) return;
    criar.mutate({ data: iso!, valorMaximo: vm!, peso: p! });
  }

  return (
    <Tela
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          rotuloVoltar="Cancelar e voltar"
          sobretitulo="Nova avaliação"
          titulo={`Turma ${turmaNome}`}
          subtitulo={disciplina}
        />
      }
      rodape={<Botao titulo="Criar e lançar notas" onPress={validarEEnviar} carregando={criar.isPending} />}
    >
      <Cartao style={{ gap: espaco.lg }}>
        <Campo rotulo="Nome da avaliação" value={nome} onChangeText={setNome} erro={erros.nome}
          placeholder="Ex.: Prova — Leitura e interpretação" />
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Tipo</Rotulo>
          <Segmentos<TipoAvaliacao>
            papel="radio"
            rotulo="Tipo"
            colunas={2}
            opcoes={TIPOS_AVALIACAO.map((t) => ({ valor: t, rotulo: rotuloTipoAvaliacao[t] }))}
            valor={tipo}
            aoMudar={setTipo}
          />
        </View>
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Bimestre</Rotulo>
          <Segmentos
            papel="radio"
            rotulo="Bimestre"
            colunas={4}
            opcoes={[1, 2, 3, 4].map((b) => ({ valor: b, rotulo: `${b}º` }))}
            valor={bimestre}
            aoMudar={setBimestre}
          />
        </View>
        <View style={{ flexDirection: "row", gap: espaco.md }}>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Valor máximo" value={valorMaximo} onChangeText={setValorMaximo} keyboardType="decimal-pad" erro={erros.valorMaximo} />
          </View>
          <View style={{ flex: 1 }}>
            <Campo rotulo="Peso" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" erro={erros.peso} />
          </View>
        </View>
        <Campo rotulo="Data de aplicação" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation"
          placeholder="DD/MM/AAAA" maxLength={10} erro={erros.data} />
      </Cartao>
    </Tela>
  );
}
