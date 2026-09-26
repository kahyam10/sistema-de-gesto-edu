import { Linking, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { comumApi } from "../../api/endpoints";
import { POLITICA_PRIVACIDADE_URL } from "../../config";
import { Botao, Cabecalho, Cartao, Carregando, Erro, Rotulo, Subtitulo, Tela, Texto } from "../../components/ui";
import type { ComumStack } from "../../navigation/tipos";
import { cores, espaco } from "../../theme";
import { dataBR, rotuloPapel } from "../../utils/formato";

type Props = NativeStackScreenProps<ComumStack, "Privacidade">;

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={{ gap: 2, paddingTop: espaco.sm, borderTopWidth: 1, borderTopColor: cores.divisor }}>
      <Texto pequeno suave>{rotulo}</Texto>
      <Texto>{valor}</Texto>
    </View>
  );
}

/** Transparência: mostra o que o sistema guarda sobre quem está usando o app. */
export function PrivacidadeScreen({ navigation }: Props) {
  const q = useQuery({ queryKey: ["meus-dados"], queryFn: comumApi.meusDados });
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const d = q.data;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => q.refetch()}
      cabecalho={<Cabecalho aoVoltar={() => navigation.goBack()} titulo="Privacidade e seus dados" subtitulo="O que o sistema guarda sobre você" />}
    >
      <Cartao>
        <Rotulo>Seu acesso</Rotulo>
        <Linha rotulo="Nome" valor={d.usuario.nome} />
        <Linha rotulo="E-mail" valor={d.usuario.email} />
        <Linha rotulo="Perfil" valor={rotuloPapel[d.usuario.papel] ?? d.usuario.papel} />
        <Linha rotulo="Cadastrado em" valor={dataBR(d.usuario.cadastradoEm)} />
        <Linha rotulo="Aparelhos conectados" valor={String(d.sessoesAtivas)} />
      </Cartao>

      {d.alunosVinculados.length > 0 ? (
        <Cartao>
          <Rotulo>Alunos que você acompanha</Rotulo>
          {d.alunosVinculados.map((a) => (
            <View key={a.numeroMatricula} style={{ gap: 2, paddingTop: espaco.sm, borderTopWidth: 1, borderTopColor: cores.divisor }}>
              <Subtitulo>{a.nomeAluno}</Subtitulo>
              <Texto pequeno suave>
                {[a.parentesco, `Matrícula ${a.numeroMatricula}`, a.escola, a.turma ? `Turma ${a.turma}` : null].filter(Boolean).join(" · ")}
              </Texto>
            </View>
          ))}
        </Cartao>
      ) : null}

      {d.turmasQueLeciona.length > 0 ? (
        <Cartao>
          <Rotulo>Turmas em que você leciona</Rotulo>
          {d.turmasQueLeciona.map((t) => (
            <Linha key={`${t.escola}-${t.turma}`} rotulo={t.escola} valor={`Turma ${t.turma}`} />
          ))}
        </Cartao>
      ) : null}

      <Cartao>
        <Rotulo>Como seus dados são usados</Rotulo>
        <Texto>O aplicativo mostra apenas informações dos alunos e turmas ligados ao seu acesso. Essa checagem é feita no servidor.</Texto>
        <Texto>Sua senha não fica gravada no aparelho. A sessão fica no armazenamento seguro do celular e é apagada quando você sai.</Texto>
        <Texto>Para corrigir um dado ou encerrar seu acesso, procure a secretaria da escola.</Texto>
      </Cartao>

      {POLITICA_PRIVACIDADE_URL ? (
        <Botao variante="secundario" icone="document-text-outline" titulo="Política de privacidade"
          onPress={() => void Linking.openURL(POLITICA_PRIVACIDADE_URL!)} />
      ) : null}
      <Botao variante="secundario" icone="call-outline" titulo="Falar com a escola" onPress={() => navigation.navigate("Contatos")} />
    </Tela>
  );
}
