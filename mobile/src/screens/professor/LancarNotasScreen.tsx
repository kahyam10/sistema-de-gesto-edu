import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { professorApi } from "../../api/endpoints";
import { Botao, Cabecalho, Cartao, Carregando, Erro, Estatistica, Tela, Texto } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { cores, espaco, fontes } from "../../theme";
import { dataBR, lerNumero, media, nota, rotuloTipoAvaliacao } from "../../utils/formato";

type Props = NativeStackScreenProps<ProfessorStack, "LancarNotas">;
const num = (v: number) => String(v).replace(".", ",");

export function LancarNotasScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome, avaliacaoId } = route.params;
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["notas", turmaId], queryFn: () => professorApi.notas(turmaId) });
  const avaliacao = q.data?.avaliacoes.find((a) => a.id === avaliacaoId);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!avaliacao) return;
    setValores(Object.fromEntries(avaliacao.notas.map((n) => [n.matriculaId, num(n.valor)])));
  }, [avaliacao?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = useMutation({
    mutationFn: (notas: Array<{ matriculaId: string; valor: number }>) => professorApi.lancarNotas(avaliacaoId, notas),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notas", turmaId] });
      navigation.popTo("Notas", { turmaId, turmaNome, aviso: `Notas de “${avaliacao?.nome ?? "avaliação"}” salvas.` });
    },
    onError: (e) => Alert.alert("Não foi possível salvar", e instanceof Error ? e.message : ""),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  if (!avaliacao) return <Erro erro={new Error("Avaliação não encontrada.")} tentarDeNovo={() => navigation.goBack()} />;

  const max = avaliacao.valorMaximo;
  // Validação na hora: vazio = ainda sem nota; fora de 0..max ou texto inválido = erro
  const linhas = q.data.alunos.map((a) => {
    const texto = valores[a.id] ?? "";
    const v = lerNumero(texto);
    const invalida = v !== null && (Number.isNaN(v) || v < 0 || v > max);
    return { ...a, texto, v, invalida };
  });
  const validas = linhas.filter((l) => l.v !== null && !l.invalida).map((l) => l.v as number);
  const temInvalida = linhas.some((l) => l.invalida);

  function enviar() {
    const notas = linhas
      .filter((l) => l.v !== null && !l.invalida)
      .map((l) => ({ matriculaId: l.id, valor: l.v as number }));
    if (notas.length === 0) return Alert.alert("Nenhuma nota preenchida");
    salvar.mutate(notas);
  }

  return (
    <Tela
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo={`${rotuloTipoAvaliacao[avaliacao.tipo] ?? avaliacao.tipo} · Turma ${turmaNome}`}
          titulo={avaliacao.nome}
          subtitulo={`${avaliacao.bimestre}º bimestre · vale ${num(max)} · peso ${num(avaliacao.peso)} · ${dataBR(avaliacao.data)}`}
        />
      }
      rodape={
        <>
          {temInvalida ? <Text style={s.erroRodape}>Corrija as notas marcadas para salvar.</Text> : null}
          <Botao titulo="Salvar notas" onPress={enviar} carregando={salvar.isPending} desabilitado={temInvalida} />
        </>
      }
    >
      <Cartao style={{ flexDirection: "row", gap: espaco.sm, padding: espaco.md }}>
        <Estatistica valor={`${validas.length} / ${linhas.length}`} rotulo="Notas lançadas" />
        <Estatistica valor={nota(media(validas))} rotulo="Média da turma" />
      </Cartao>
      <Texto pequeno suave>Use vírgula para decimais. Deixe em branco quem ainda não fez a avaliação.</Texto>

      {linhas.map((a) => (
        <View key={a.id} style={s.linha}>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={s.nome} numberOfLines={2}>{a.nomeAluno}</Text>
            {a.invalida ? (
              <Text style={s.erro}>Nota entre 0 e {num(max)}</Text>
            ) : (
              <Texto pequeno suave>Matrícula {a.numeroMatricula}</Texto>
            )}
          </View>
          <TextInput
            value={a.texto}
            onChangeText={(t) => setValores((v) => ({ ...v, [a.id]: t.replace(/[^0-9.,]/g, "") }))}
            keyboardType="decimal-pad"
            placeholder="—"
            placeholderTextColor={cores.textoApagado}
            accessibilityLabel={`Nota de ${a.nomeAluno}`}
            accessibilityHint={a.invalida ? `Inválida: use de 0 a ${num(max)}` : undefined}
            style={[s.input, a.invalida && s.inputErro]}
            maxLength={5}
          />
        </View>
      ))}
    </Tela>
  );
}

const s = StyleSheet.create({
  linha: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: cores.superficie,
    borderRadius: 14, borderWidth: 1, borderColor: cores.borda, paddingVertical: espaco.sm, paddingLeft: espaco.md, paddingRight: espaco.sm,
  },
  nome: { fontFamily: fontes.negrito, fontSize: 15, color: cores.texto },
  erro: { fontFamily: fontes.negrito, fontSize: 12, color: cores.perigoTexto },
  erroRodape: { fontFamily: fontes.negrito, fontSize: 13, color: cores.perigoTexto, textAlign: "center" },
  input: {
    width: 76, height: 44, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: 10, backgroundColor: cores.superficie,
    textAlign: "center", fontSize: 18, fontFamily: fontes.negrito, color: cores.texto,
  },
  inputErro: { borderWidth: 2, borderColor: cores.perigo, backgroundColor: "#FFF6F3" },
});
