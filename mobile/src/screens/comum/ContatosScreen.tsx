import { Alert, Linking, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { comumApi } from "../../api/endpoints";
import { Botao, Cabecalho, Cartao, Carregando, Erro, Subtitulo, Tela, Texto, Vazio } from "../../components/ui";
import type { ComumStack } from "../../navigation/tipos";
import { espaco } from "../../theme";

type Props = NativeStackScreenProps<ComumStack, "Contatos">;

async function abrir(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert("Não foi possível abrir", "Nenhum aplicativo do aparelho abre este contato.");
  }
}

export function ContatosScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["escolas"], queryFn: comumApi.escolas });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={<Cabecalho aoVoltar={() => navigation.goBack()} titulo="Falar com a escola" subtitulo="Contatos oficiais da secretaria" />}
    >
      {q.data.length === 0 ? (
        <Vazio texto="Nenhuma escola vinculada ao seu acesso." />
      ) : (
        q.data.map((e) => {
          // Só dígitos (e + inicial) no link tel:; o texto mostra como cadastrado
          const tel = e.telefone?.replace(/[^\d+]/g, "") ?? "";
          const email = e.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email) ? e.email : null;
          return (
            <Cartao key={e.id}>
              <Subtitulo>{e.nome}</Subtitulo>
              {e.endereco ? <Texto pequeno suave>{e.endereco}</Texto> : null}
              {e.telefone ? <Texto>{e.telefone}</Texto> : null}
              {email ? <Texto>{email}</Texto> : null}
              <View style={{ flexDirection: "row", gap: espaco.sm }}>
                {tel.length >= 8 ? (
                  <View style={{ flex: 1 }}>
                    <Botao compacto icone="call-outline" titulo="Ligar" onPress={() => void abrir(`tel:${tel}`)} />
                  </View>
                ) : null}
                {email ? (
                  <View style={{ flex: 1 }}>
                    <Botao compacto variante="secundario" icone="mail-outline" titulo="E-mail" onPress={() => void abrir(`mailto:${email}`)} />
                  </View>
                ) : null}
              </View>
              {!e.telefone && !email ? <Texto pequeno suave>A escola ainda não cadastrou telefone nem e-mail.</Texto> : null}
            </Cartao>
          );
        })
      )}
    </Tela>
  );
}
