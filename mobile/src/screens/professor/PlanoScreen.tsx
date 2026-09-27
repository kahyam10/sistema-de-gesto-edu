import { Alert, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { planejamentoApi } from "../../api/endpoints";
import {
  Aviso, Botao, Cabecalho, Cartao, Carregando, Erro, Rotulo, Selo, Tela, Texto,
} from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";
import { espaco } from "../../theme";
import { dataBR, dataHoraBR } from "../../utils/formato";
import { planoEditavel, STATUS_PLANO } from "../../utils/planejamento";

type Props = NativeStackScreenProps<ProfessorStack, "Plano">;

function Bloco({ titulo, texto }: { titulo: string; texto: string | null | undefined }) {
  if (!texto) return null;
  return (
    <View style={{ gap: 4 }}>
      <Rotulo>{titulo}</Rotulo>
      <Texto>{texto}</Texto>
    </View>
  );
}

export function PlanoScreen({ route, navigation }: Props) {
  const { planoId, turmaId, turmaNome } = route.params;
  const queryClient = useQueryClient();
  const q = useQuery({ queryKey: ["plano", planoId], queryFn: () => planejamentoApi.plano(planoId) });

  const enviar = useMutation({
    mutationFn: () => planejamentoApi.enviar(planoId),
    onSuccess: (plano) => {
      queryClient.setQueryData(["plano", planoId], plano);
      void queryClient.invalidateQueries({ queryKey: ["planos", turmaId] });
    },
    onError: (e) => Alert.alert("Não foi possível enviar", e instanceof Error ? e.message : ""),
  });

  function confirmarEnvio() {
    Alert.alert(
      "Enviar para a coordenação?",
      "Depois de enviado, o plano só volta a ser editável se a coordenação devolver.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Enviar", onPress: () => enviar.mutate() },
      ]
    );
  }

  const p = q.data;
  const editavel = p ? planoEditavel(p.status) : false;

  return (
    <Tela
      atualizando={q.isRefetching}
      aoAtualizar={() => void q.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={() => navigation.goBack()}
          sobretitulo={p ? `${p.disciplina.nome} · ${p.bimestre}º bimestre` : "Plano de aula"}
          titulo={p?.titulo ?? "Plano de aula"}
          subtitulo={p ? `Turma ${turmaNome} · aula em ${dataBR(p.dataAula)}` : undefined}
        />
      }
      rodape={
        p && editavel ? (
          <View style={{ gap: espaco.sm }}>
            <Botao titulo="Enviar para a coordenação" icone="send-outline" onPress={confirmarEnvio} carregando={enviar.isPending} />
            <Botao titulo="Editar" variante="secundario" icone="create-outline"
              onPress={() => navigation.navigate("PlanoForm", { turmaId, turmaNome, planoId })} />
          </View>
        ) : undefined
      }
    >
      {q.isPending ? <Carregando /> : q.isError ? <Erro erro={q.error} tentarDeNovo={() => q.refetch()} /> : p ? (
        <>
          <View style={{ flexDirection: "row", gap: espaco.sm, alignItems: "center", flexWrap: "wrap" }}>
            <Selo texto={STATUS_PLANO[p.status].rotulo} tom={STATUS_PLANO[p.status].tom} />
            {p.enviadoEm && p.status === "ENVIADO" ? <Texto pequeno suave>enviado em {dataHoraBR(p.enviadoEm)}</Texto> : null}
          </View>

          {p.status === "DEVOLVIDO" ? (
            <Aviso tom="alerta" texto={`Devolvido${p.revisadoPor ? ` por ${p.revisadoPor.nome}` : ""}: ${p.parecer ?? "sem parecer escrito"}. Ajuste e envie de novo.`} />
          ) : p.status === "APROVADO" ? (
            <Aviso tom="sucesso" texto={`Aprovado${p.revisadoPor ? ` por ${p.revisadoPor.nome}` : ""}${p.parecer ? `: ${p.parecer}` : "."}`} />
          ) : null}

          <Cartao style={{ gap: espaco.lg }}>
            <Bloco titulo="Objetivos" texto={p.objetivos} />
            <Bloco titulo="Desenvolvimento" texto={p.desenvolvimento} />
            <Bloco titulo="Recursos" texto={p.recursos} />
            <Bloco titulo="Avaliação" texto={p.avaliacao} />
            <Bloco titulo="Conteúdo programático" texto={p.conteudoProgramatico?.titulo} />
            <Bloco titulo="Habilidades BNCC" texto={p.habilidadesBncc.length ? p.habilidadesBncc.join(", ") : null} />
            <Bloco titulo="Atividades do banco" texto={p.atividades.length ? p.atividades.map((a) => a.titulo).join(" · ") : null} />
          </Cartao>
        </>
      ) : null}
    </Tela>
  );
}
