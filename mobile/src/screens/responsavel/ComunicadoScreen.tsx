import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { comumApi } from "../../api/endpoints";
import { Aviso, Botao, Cabecalho, Cartao, Carregando, Erro, Tela, Texto } from "../../components/ui";
import type { ComumStack } from "../../navigation/tipos";
import { capitalizar, dataBR } from "../../utils/formato";

type Props = NativeStackScreenProps<ComumStack, "Comunicado">;

export function ComunicadoScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["comunicados"], queryFn: comumApi.comunicados });
  const c = q.data?.find((x) => x.id === id);

  // Abrir = ler. Registra uma vez por abertura (o servidor usa o usuário da sessão).
  const marcou = useRef(false);
  const marcarLido = useMutation({
    mutationFn: () => comumApi.marcarLido(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["comunicados"] }),
  });
  useEffect(() => {
    if (c && !c.lido && !marcou.current) {
      marcou.current = true;
      marcarLido.mutate();
    }
  }, [c]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmar = useMutation({
    mutationFn: () => comumApi.confirmarComunicado(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["comunicados"] }),
    onError: (e) => Alert.alert("Não foi possível confirmar", e instanceof Error ? e.message : ""),
  });

  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  if (!c) return <Erro erro={new Error("Comunicado não encontrado.")} tentarDeNovo={() => navigation.goBack()} />;

  return (
    <Tela
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo={capitalizar(c.tipo)}
          titulo={c.titulo}
          subtitulo={`${c.autorNome} · ${c.escola?.nome ?? "Secretaria de Educação"} · ${dataBR(c.dataPublicacao)}`}
        />
      }
    >
      <Cartao>
        <Texto>{c.mensagem}</Texto>
      </Cartao>
      {c.confirmado ? (
        <Aviso texto="Ciência confirmada. Obrigado!" />
      ) : (
        <>
          <Botao titulo="Confirmar que li o comunicado" onPress={() => confirmar.mutate()} carregando={confirmar.isPending} />
          <Texto pequeno suave centro>A escola verá que você recebeu este aviso.</Texto>
        </>
      )}
    </Tela>
  );
}
