import { Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { responsavelApi } from "../../api/endpoints";
import type { Comunicado } from "../../api/types";
import { Cabecalho, Carregando, Erro, Selo, Tela, Vazio } from "../../components/ui";
import type { ResponsavelStack } from "../../navigation/tipos";
import { cores, espaco, fontes, raio } from "../../theme";
import { capitalizar, diaMes } from "../../utils/formato";

type Props = NativeStackScreenProps<ResponsavelStack, "Comunicados">;

function primeiraLinha(texto: string, max = 90): string {
  const l = texto.split("\n").find((x) => x.trim()) ?? "";
  return l.length > max ? `${l.slice(0, max).trim()}…` : l;
}

/** Item de lista: ponto azul = não lido; título em negrito enquanto não lido. */
export function ComunicadoItem({ comunicado: c, onPress, resumo = false }: {
  comunicado: Comunicado; onPress: () => void; resumo?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${c.lido ? "" : "Não lido. "}${c.titulo}`}
      style={({ pressed }) => [s.item, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={[s.ponto, { backgroundColor: c.lido ? "transparent" : cores.marca }]} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.meta}>
          {capitalizar(c.tipo)} · {diaMes(c.dataPublicacao)}{resumo ? "" : ` · ${c.autorNome}`}
        </Text>
        <Text style={[s.titulo, { fontFamily: c.lido ? fontes.regular : fontes.negrito }]}>{c.titulo}</Text>
        {!resumo ? <Text style={s.trecho}>{primeiraLinha(c.mensagem)}</Text> : null}
        <View style={{ flexDirection: "row", gap: espaco.sm, flexWrap: "wrap" }}>
          {c.tipo === "URGENTE" ? <Selo texto="Urgente" tom="perigo" /> : null}
          {c.confirmado ? <Selo texto="Ciência confirmada" tom="sucesso" /> : <Selo texto="Confirmação pendente" tom="alerta" />}
        </View>
      </View>
    </Pressable>
  );
}

export function ComunicadosScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["comunicados"], queryFn: responsavelApi.comunicados });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  const naoLidos = q.data.filter((c) => !c.lido).length;
  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={
        <Cabecalho
          titulo="Comunicados"
          subtitulo={naoLidos === 0 ? "Tudo lido por aqui." : naoLidos === 1 ? "1 comunicado não lido" : `${naoLidos} comunicados não lidos`}
        />
      }
    >
      {q.data.length === 0 ? (
        <Vazio texto="Nenhum comunicado no momento." />
      ) : (
        q.data.map((c) => (
          <ComunicadoItem key={c.id} comunicado={c} onPress={() => navigation.navigate("Comunicado", { id: c.id })} />
        ))
      )}
    </Tela>
  );
}

const s = StyleSheet.create({
  item: {
    flexDirection: "row", gap: espaco.md, alignItems: "flex-start", backgroundColor: cores.superficie,
    borderRadius: raio.lg, borderWidth: 1, borderColor: cores.borda, paddingHorizontal: espaco.lg, paddingVertical: 14,
  },
  ponto: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  meta: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave },
  titulo: { fontSize: 16, lineHeight: 21, color: cores.texto },
  trecho: { fontFamily: fontes.regular, fontSize: 14, lineHeight: 19, color: cores.textoSuave },
});
