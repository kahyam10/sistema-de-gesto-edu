import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { professorApi, responsavelApi } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { Avatar, Botao, Cabecalho, Cartao, Rotulo, Selo, Subtitulo, Tela, Texto } from "../components/ui";
import { cores, espaco } from "../theme";
import { capitalizar, rotuloPapel } from "../utils/formato";

export function PerfilScreen() {
  const { usuario, sair } = useAuth();
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

      <Botao titulo="Sair da conta" variante="perigo" onPress={() => void sair()} />
      <Texto pequeno suave centro>Versão {Constants.expoConfig?.version ?? "—"}</Texto>
    </Tela>
  );
}
