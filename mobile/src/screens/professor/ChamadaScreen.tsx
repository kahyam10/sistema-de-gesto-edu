import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import type { StatusFrequencia } from "../../api/types";
import { Botao, Cartao, Carregando, Erro, Selo, Tela, Texto, Titulo, Vazio } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, raio } from "../../theme";
import { dataBR, hojeISO } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "Chamada">;

const OPCOES: Array<{ valor: StatusFrequencia; rotulo: string; bg: string; fg: string }> = [
  { valor: "PRESENTE", rotulo: "P", bg: cores.sucessoSuave, fg: cores.sucesso },
  { valor: "FALTA", rotulo: "F", bg: cores.perigoSuave, fg: cores.perigo },
  { valor: "JUSTIFICADA", rotulo: "J", bg: cores.alertaSuave, fg: cores.alerta },
];

export function ChamadaScreen({ route, navigation }: Props) {
  const { turmaId } = route.params;
  const data = hojeISO();
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["chamada", turmaId, data], queryFn: () => professorApi.chamada(turmaId, data) });
  const [marcacoes, setMarcacoes] = useState<Record<string, StatusFrequencia>>({});

  // Pré-preenche: o que já foi lançado hoje, ou todos presentes
  useEffect(() => {
    if (!q.data) return;
    setMarcacoes(Object.fromEntries(q.data.alunos.map((a) => [a.id, a.status ?? "PRESENTE"])));
  }, [q.data]);

  const totais = useMemo(() => {
    const v = Object.values(marcacoes);
    return { presentes: v.filter((x) => x === "PRESENTE").length, faltas: v.filter((x) => x !== "PRESENTE").length };
  }, [marcacoes]);

  const salvar = useMutation({
    mutationFn: () =>
      professorApi.salvarChamada(
        turmaId,
        data,
        Object.entries(marcacoes).map(([matriculaId, status]) => ({ matriculaId, status }))
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["professor", "resumo"] });
      void queryClient.invalidateQueries({ queryKey: ["chamada", turmaId, data] });
      Alert.alert("Chamada salva", `${totais.presentes} presentes, ${totais.faltas} ausentes.`);
      navigation.goBack();
    },
    onError: (e) => Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : ""),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  return (
    <Tela>
      <Cartao>
        <Titulo>{q.data.turma.nome}</Titulo>
        <Texto suave>{dataBR(q.data.data)} · {q.data.turma.escola.nome}</Texto>
        {q.data.jaRegistrada && <Selo texto="Já registrada hoje — salvar substitui" tom="marca" />}
      </Cartao>

      {q.data.alunos.length === 0 ? (
        <Vazio texto="Nenhum aluno ativo nesta turma." />
      ) : (
        q.data.alunos.map((a) => (
          <View key={a.id} style={s.linha}>
            <Text style={s.nome} numberOfLines={2}>{a.nomeAluno}</Text>
            <View style={s.opcoes}>
              {OPCOES.map((o) => {
                const ativo = marcacoes[a.id] === o.valor;
                return (
                  <Pressable
                    key={o.valor}
                    onPress={() => setMarcacoes((m) => ({ ...m, [a.id]: o.valor }))}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: ativo }}
                    accessibilityLabel={`${a.nomeAluno}: ${o.valor.toLowerCase()}`}
                    style={[s.opcao, { backgroundColor: ativo ? o.fg : o.bg }]}
                  >
                    <Text style={[s.opcaoTexto, { color: ativo ? "#fff" : o.fg }]}>{o.rotulo}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))
      )}

      <Texto suave>{totais.presentes} presentes · {totais.faltas} ausentes</Texto>
      <Botao
        titulo="Salvar chamada"
        onPress={() => salvar.mutate()}
        carregando={salvar.isPending}
        desabilitado={q.data.alunos.length === 0}
      />
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: {
    flexDirection: "row", alignItems: "center", gap: espaco.md, backgroundColor: cores.superficie,
    borderRadius: raio.md, borderWidth: 1, borderColor: cores.borda, padding: espaco.md,
  },
  nome: { flex: 1, fontSize: 15, color: cores.texto },
  opcoes: { flexDirection: "row", gap: espaco.xs },
  opcao: { width: 44, height: 44, borderRadius: raio.sm, alignItems: "center", justifyContent: "center" },
  opcaoTexto: { fontSize: 16, fontWeight: "700" },
});
