import { useState } from "react";
import { Alert, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { responsavelApi } from "../../api/endpoints";
import { Botao, Cartao, Carregando, Erro, Selo, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import { espaco } from "../../theme";
import { dataBR } from "../../utils/formato";

export function ComunicadosScreen() {
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["comunicados"], queryFn: responsavelApi.comunicados });
  const [aberto, setAberto] = useState<string | null>(null);

  const confirmar = useMutation({
    mutationFn: (id: string) => responsavelApi.confirmarComunicado(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["comunicados"] }),
    onError: (e) => Alert.alert("Não foi possível confirmar", e instanceof Error ? e.message : ""),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  return (
    <Tela atualizando={q.isRefetching} aoAtualizar={() => q.refetch()}>
      {q.data.length === 0 ? (
        <Vazio texto="Nenhum comunicado no momento." />
      ) : (
        q.data.map((c) => {
          const expandido = aberto === c.id;
          return (
            <Cartao key={c.id} onPress={() => setAberto(expandido ? null : c.id)}>
              <View style={{ flexDirection: "row", gap: espaco.sm, flexWrap: "wrap" }}>
                {c.destaque && <Selo texto="Destaque" tom="alerta" />}
                {c.tipo === "URGENTE" && <Selo texto="Urgente" tom="perigo" />}
                {c.confirmado && <Selo texto="Ciência registrada" tom="sucesso" />}
              </View>
              <Subtitulo>{c.titulo}</Subtitulo>
              <Texto suave>{dataBR(c.dataPublicacao)} · {c.escola?.nome ?? "Secretaria de Educação"} · {c.autorNome}</Texto>
              {expandido && (
                <>
                  <Texto>{c.mensagem}</Texto>
                  {!c.confirmado && (
                    <Botao
                      titulo="Confirmar que li"
                      variante="secundario"
                      carregando={confirmar.isPending && confirmar.variables === c.id}
                      onPress={() => confirmar.mutate(c.id)}
                    />
                  )}
                </>
              )}
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}
