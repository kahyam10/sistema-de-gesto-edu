import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Botao, Cartao, Carregando, Erro, Tela, Texto, Titulo } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, raio } from "../../theme";

type Props = NativeStackScreenProps<ProfessorStack, "LancarNotas">;

export function LancarNotasScreen({ route, navigation }: Props) {
  const { turmaId, avaliacaoId } = route.params;
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const avaliacao = q.data?.avaliacoes.find((a) => a.id === avaliacaoId);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!avaliacao) return;
    setValores(Object.fromEntries(avaliacao.notas.map((n) => [n.matriculaId, String(n.valor).replace(".", ",")])));
  }, [avaliacao?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = useMutation({
    mutationFn: (notas: Array<{ matriculaId: string; valor: number }>) => professorApi.lancarNotas(avaliacaoId, notas),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notas", turmaId] });
      Alert.alert("Notas salvas");
      navigation.goBack();
    },
    onError: (e) => Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : ""),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  if (!avaliacao) return <Erro erro={new Error("Avaliação não encontrada.")} />;

  function enviar() {
    const notas: Array<{ matriculaId: string; valor: number }> = [];
    for (const [matriculaId, texto] of Object.entries(valores)) {
      if (texto.trim() === "") continue; // em branco = ainda sem nota
      const valor = Number(texto.replace(",", "."));
      if (Number.isNaN(valor) || valor < 0 || valor > avaliacao!.valorMaximo) {
        const aluno = q.data!.alunos.find((a) => a.id === matriculaId)?.nomeAluno ?? "aluno";
        Alert.alert("Nota inválida", `${aluno}: use um valor entre 0 e ${avaliacao!.valorMaximo}.`);
        return;
      }
      notas.push({ matriculaId, valor });
    }
    if (notas.length === 0) return Alert.alert("Nenhuma nota preenchida");
    salvar.mutate(notas);
  }

  return (
    <Tela>
      <Cartao>
        <Titulo>{avaliacao.nome}</Titulo>
        <Texto suave>{avaliacao.bimestre}º bimestre · vale {avaliacao.valorMaximo}. Deixe em branco quem ainda não fez.</Texto>
      </Cartao>
      {q.data.alunos.map((a) => (
        <View key={a.id} style={s.linha}>
          <Text style={s.nome} numberOfLines={2}>{a.nomeAluno}</Text>
          <TextInput
            value={valores[a.id] ?? ""}
            onChangeText={(t) => setValores((v) => ({ ...v, [a.id]: t.replace(/[^0-9.,]/g, "") }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={cores.textoSuave}
            accessibilityLabel={`Nota de ${a.nomeAluno}`}
            style={s.input}
            maxLength={5}
          />
        </View>
      ))}
      <Botao titulo="Salvar notas" onPress={enviar} carregando={salvar.isPending} />
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: {
    flexDirection: "row", alignItems: "center", gap: espaco.md, backgroundColor: cores.superficie,
    borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, padding: espaco.md,
  },
  nome: { flex: 1, fontSize: 15, color: cores.texto },
  input: {
    width: 72, height: 44, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.sm,
    textAlign: "center", fontSize: 17, fontWeight: "600", color: cores.texto,
  },
});
