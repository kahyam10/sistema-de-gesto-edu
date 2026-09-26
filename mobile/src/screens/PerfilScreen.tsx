import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { professorApi, responsavelApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { Avatar, Botao, Cabecalho, Cartao, NomeIcone, Rotulo, Selo, Subtitulo, Tela, Texto } from "../components/ui";
import type { ComumStack } from "../navigation/tipos";
import { cores, espaco, fontes } from "../theme";
import { useNotificacoes } from "./comum/NotificacoesScreen";
import { capitalizar, rotuloPapel } from "../utils/formato";

type Props = NativeStackScreenProps<ComumStack, "Perfil">;

function ItemMenu({ icone, titulo, contador, onPress, primeiro }: {
  icone: NomeIcone; titulo: string; contador?: number; onPress: () => void; primeiro?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={contador ? `${titulo}, ${contador} novas` : titulo}
      style={({ pressed }) => [s.item, !primeiro && s.itemDivisor, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Ionicons name={icone} size={22} color={cores.marca} />
      <Text style={s.itemTexto}>{titulo}</Text>
      {contador ? <View style={s.contador}><Text style={s.contadorTexto}>{contador}</Text></View> : null}
      <Ionicons name="chevron-forward" size={20} color={cores.textoSuave} />
    </Pressable>
  );
}

export function PerfilScreen({ navigation }: Props) {
  const { usuario, sair } = useAuth();
  const notificacoes = useNotificacoes();
  const novas = notificacoes.data?.filter((n) => !n.lida).length ?? 0;
  const professor = usuario?.role === "PROFESSOR";
  // Mesmos caches das telas iniciais (sem request extra na maioria dos casos)
  const resumo = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo, enabled: professor });
  const alunos = useQuery({ queryKey: ["meus-alunos"], queryFn: responsavelApi.alunos, enabled: !professor });

  return (
    <Tela
      cabecalho={
        <Cabecalho
          esquerda={<Avatar nome={usuario?.nome ?? "?"} tamanho={60} invertido />}
          titulo={usuario?.nome ?? ""}
          subtitulo={usuario?.email}
        />
      }
    >
      <Selo texto={rotuloPapel[usuario?.role ?? ""] ?? usuario?.role ?? ""} tom="marca" />

      {professor ? (
        <Cartao>
          <Rotulo>Minhas turmas</Rotulo>
          {(resumo.data?.turmas ?? []).map((t) => (
            <View key={t.id} style={{ gap: 2, paddingTop: espaco.sm, borderTopWidth: 1, borderTopColor: cores.divisor }}>
              <Subtitulo>Turma {t.nome} · {t.serie.nome}</Subtitulo>
              <Texto pequeno suave>{t.escola.nome} · {capitalizar(t.turno)}{t.disciplina ? ` · ${t.disciplina}` : ""}</Texto>
            </View>
          ))}
          {resumo.data && resumo.data.turmas.length === 0 ? <Texto suave>Nenhuma turma vinculada.</Texto> : null}
        </Cartao>
      ) : (
        <Cartao>
          <Rotulo>Alunos vinculados</Rotulo>
          {(alunos.data ?? []).map(({ matricula: m, parentesco }) => (
            <View key={m.id} style={{ flexDirection: "row", alignItems: "center", gap: espaco.md, paddingTop: espaco.sm, borderTopWidth: 1, borderTopColor: cores.divisor }}>
              <Avatar nome={m.nomeAluno} tamanho={40} />
              <View style={{ flex: 1, gap: 1 }}>
                <Subtitulo>{m.nomeAluno}</Subtitulo>
                <Texto pequeno suave>{[parentesco, m.turma?.serie.nome, m.escola.nome].filter(Boolean).join(" · ")}</Texto>
              </View>
            </View>
          ))}
          {alunos.data && alunos.data.length === 0 ? <Texto suave>Nenhum aluno vinculado.</Texto> : null}
        </Cartao>
      )}

      <View style={s.menu}>
        <ItemMenu primeiro icone="notifications-outline" titulo="Notificações" contador={novas} onPress={() => navigation.navigate("Notificacoes")} />
        <ItemMenu icone="shield-checkmark-outline" titulo="Privacidade e seus dados" onPress={() => navigation.navigate("Privacidade")} />
        <ItemMenu icone="call-outline" titulo="Falar com a escola" onPress={() => navigation.navigate("Contatos")} />
      </View>

      <Botao titulo="Sair da conta" variante="perigo" onPress={() => void sair()} />
      <Texto pequeno suave centro>Versão {Constants.expoConfig?.version ?? "—"}</Texto>
    </Tela>
  );
}

const s = StyleSheet.create({
  menu: { backgroundColor: cores.superficie, borderRadius: 16, borderWidth: 1, borderColor: cores.borda, overflow: "hidden" },
  item: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: espaco.md, paddingHorizontal: espaco.lg },
  itemDivisor: { borderTopWidth: 1, borderTopColor: cores.divisor },
  itemTexto: { flex: 1, fontFamily: fontes.regular, fontSize: 16, color: cores.texto },
  contador: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: cores.perigo, alignItems: "center", justifyContent: "center" },
  contadorTexto: { fontFamily: fontes.negrito, fontSize: 12, color: "#fff" },
});
