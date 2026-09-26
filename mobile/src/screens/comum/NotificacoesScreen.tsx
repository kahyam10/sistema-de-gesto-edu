import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { comumApi } from "../../api/endpoints";
import type { Notificacao } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Botao, Cabecalho, Carregando, Erro, Selo, Tela, Vazio } from "../../components/ui";
import type { ComumStack } from "../../navigation/tipos";
import { cores, espaco, fontes, raio } from "../../theme";
import { dataHoraBR } from "../../utils/formato";

type Props = NativeStackScreenProps<ComumStack, "Notificacoes">;

/** Mesmo cache usado pelo selo da aba Perfil. */
export function useNotificacoes() {
  const { usuario } = useAuth();
  return useQuery({
    queryKey: ["notificacoes", usuario?.id],
    queryFn: () => comumApi.notificacoes(usuario!.id),
    enabled: !!usuario,
  });
}

export function NotificacoesScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const q = useNotificacoes();
  const atualizar = () => void queryClient.invalidateQueries({ queryKey: ["notificacoes"] });

  const marcar = useMutation({ mutationFn: (id: string) => comumApi.marcarNotificacaoLida(id), onSuccess: atualizar });
  const marcarTodas = useMutation({
    mutationFn: () => comumApi.marcarTodasLidas(usuario!.id),
    onSuccess: atualizar,
    onError: (e) => Alert.alert("Não foi possível marcar", e instanceof Error ? e.message : ""),
  });

  function abrir(n: Notificacao) {
    if (!n.lida) marcar.mutate(n.id);
    // Só ações conhecidas navegam; links externos da notificação são ignorados
    if (n.acaoTipo === "VISUALIZAR_COMUNICADO" && n.acaoId) navigation.navigate("Comunicado", { id: n.acaoId });
  }

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const naoLidas = q.data.filter((n) => !n.lida).length;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          titulo="Notificações"
          subtitulo={naoLidas === 0 ? "Nenhuma notificação nova." : naoLidas === 1 ? "1 não lida" : `${naoLidas} não lidas`}
        />
      }
    >
      {naoLidas > 0 ? (
        <Botao compacto variante="secundario" icone="checkmark-done-outline" titulo="Marcar todas como lidas"
          onPress={() => marcarTodas.mutate()} carregando={marcarTodas.isPending} />
      ) : null}
      {q.data.length === 0 ? (
        <Vazio texto="Você ainda não recebeu notificações." />
      ) : (
        q.data.map((n) => (
          <Pressable
            key={n.id}
            onPress={() => abrir(n)}
            accessibilityRole="button"
            accessibilityLabel={`${n.lida ? "" : "Não lida. "}${n.titulo}`}
            style={({ pressed }) => [s.item, { opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[s.ponto, { backgroundColor: n.lida ? "transparent" : cores.marca }]} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={s.meta}>{dataHoraBR(n.createdAt)}</Text>
              <Text style={[s.titulo, { fontFamily: n.lida ? fontes.regular : fontes.negrito }]}>{n.titulo}</Text>
              <Text style={s.mensagem}>{n.mensagem}</Text>
              {n.prioridade === "ALTA" || n.prioridade === "URGENTE" || n.tipo === "URGENTE" ? (
                <Selo texto={n.prioridade === "ALTA" ? "Importante" : "Urgente"} tom="perigo" />
              ) : null}
            </View>
          </Pressable>
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
  mensagem: { fontFamily: fontes.regular, fontSize: 14, lineHeight: 20, color: cores.texto },
});
