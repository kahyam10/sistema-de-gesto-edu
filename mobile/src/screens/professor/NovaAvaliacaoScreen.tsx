import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Botao, Campo, Rotulo, Tela } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, raio } from "../../theme";
import { hojeISO } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "NovaAvaliacao">;
const TIPOS = ["PROVA", "TRABALHO", "ATIVIDADE", "PARTICIPACAO", "RECUPERACAO"] as const;
const ROTULO_TIPO: Record<(typeof TIPOS)[number], string> = {
  PROVA: "Prova", TRABALHO: "Trabalho", ATIVIDADE: "Atividade", PARTICIPACAO: "Participação", RECUPERACAO: "Recuperação",
};

const numero = (t: string) => Number(t.replace(",", "."));

export function NovaAvaliacaoScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome, disciplinaId } = route.params;
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>("PROVA");
  const [bimestre, setBimestre] = useState(1);
  const [valorMaximo, setValorMaximo] = useState("10");
  const [peso, setPeso] = useState("1");
  const [data, setData] = useState(hojeISO());

  const criar = useMutation({
    mutationFn: () =>
      professorApi.criarAvaliacao({
        nome: nome.trim(), tipo, bimestre, data, valorMaximo: numero(valorMaximo), peso: numero(peso), turmaId, disciplinaId,
      }),
    onSuccess: (av) => {
      void queryClient.invalidateQueries({ queryKey: ["notas", turmaId] });
      navigation.replace("LancarNotas", { turmaId, turmaNome, avaliacaoId: av.id });
    },
    onError: (e) => Alert.alert("Não foi possível criar", e instanceof Error ? e.message : ""),
  });

  function validarEEnviar() {
    if (nome.trim().length < 2) return Alert.alert("Informe o nome da avaliação");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return Alert.alert("Data no formato AAAA-MM-DD");
    const vm = numero(valorMaximo);
    const p = numero(peso);
    if (!(vm > 0 && vm <= 100)) return Alert.alert("Valor máximo inválido");
    if (!(p > 0 && p <= 10)) return Alert.alert("Peso inválido");
    criar.mutate();
  }

  return (
    <Tela>
      <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ex.: Prova do 3º bimestre" />
      <Rotulo>Tipo</Rotulo>
      <View style={s.linha}>
        {TIPOS.map((t) => (
          <Pressable key={t} onPress={() => setTipo(t)} style={[s.chip, tipo === t && s.chipAtivo]}
            accessibilityRole="radio" accessibilityState={{ selected: tipo === t }}>
            <Text style={[s.chipTexto, tipo === t && { color: "#fff" }]}>{ROTULO_TIPO[t]}</Text>
          </Pressable>
        ))}
      </View>
      <Rotulo>Bimestre</Rotulo>
      <View style={s.linha}>
        {[1, 2, 3, 4].map((b) => (
          <Pressable key={b} onPress={() => setBimestre(b)} style={[s.chip, bimestre === b && s.chipAtivo]}
            accessibilityRole="radio" accessibilityState={{ selected: bimestre === b }}>
            <Text style={[s.chipTexto, bimestre === b && { color: "#fff" }]}>{b}º</Text>
          </Pressable>
        ))}
      </View>
      <Campo rotulo="Data (AAAA-MM-DD)" value={data} onChangeText={setData} keyboardType="numbers-and-punctuation" />
      <View style={{ flexDirection: "row", gap: espaco.md }}>
        <View style={{ flex: 1 }}><Campo rotulo="Vale" value={valorMaximo} onChangeText={setValorMaximo} keyboardType="decimal-pad" /></View>
        <View style={{ flex: 1 }}><Campo rotulo="Peso" value={peso} onChangeText={setPeso} keyboardType="decimal-pad" /></View>
      </View>
      <Botao titulo="Criar e lançar notas" onPress={validarEEnviar} carregando={criar.isPending} />
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: { flexDirection: "row", flexWrap: "wrap", gap: espaco.sm },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: raio.sm, backgroundColor: cores.superficie, borderWidth: 1, borderColor: cores.borda },
  chipAtivo: { backgroundColor: cores.marca, borderColor: cores.marca },
  chipTexto: { color: cores.texto, fontWeight: "600" },
});
