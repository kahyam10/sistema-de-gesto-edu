import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { comumApi } from "../../api/endpoints";
import type { Agenda, CardapioSemana } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { Cabecalho, Cartao, Carregando, Erro, NomeIcone, Segmentos, Selo, Tela, Texto, Tom, Vazio } from "../../components/ui";
import type { ComumStack } from "../../navigation/tipos";
import { cores, espaco, fontes, raio } from "../../theme";
import { capitalizar, dataPorExtenso, diaMes, hojeISO, rotuloEvento, rotuloRefeicao } from "../../utils/formato";

type Props = NativeStackScreenProps<ComumStack, "Agenda">;

export interface ItemAgenda {
  chave: string;
  data: string; // AAAA-MM-DD
  titulo: string;
  rotulo: string;
  tom: Tom;
  icone: NomeIcone;
  horario: string | null;
  detalhes: string[];
  descricao: string | null;
  cancelado: boolean;
}

const REPETICAO = { SEMANAL: "Toda semana", MENSAL: "Todo mês", ANUAL: "Todo ano" } as const;

/** Junta eventos, reuniões e plantões numa lista só, em ordem de data. */
export function itensDaAgenda(a: Agenda): ItemAgenda[] {
  const itens: ItemAgenda[] = [
    ...a.eventos.map((e) => ({
      chave: `e-${e.id}`,
      data: e.dataInicio.slice(0, 10),
      titulo: e.titulo,
      rotulo: rotuloEvento[e.tipo] ?? capitalizar(e.tipo),
      tom: (e.tipo === "FERIADO" || e.tipo === "RECESSO" ? "alerta" : "marca") as Tom,
      icone: "calendar-outline" as NomeIcone,
      horario: e.horaInicio ? `${e.horaInicio}${e.horaFim ? `–${e.horaFim}` : ""}` : null,
      detalhes: [
        e.dataFim && e.dataFim.slice(0, 10) !== e.dataInicio.slice(0, 10) ? `até ${diaMes(e.dataFim)}` : null,
        e.tipoRecorrencia ? REPETICAO[e.tipoRecorrencia] : null,
        e.escola?.nome ?? "Toda a rede",
      ].filter((x): x is string => !!x),
      descricao: e.descricao,
      cancelado: false,
    })),
    ...a.reunioes.map((r) => ({
      chave: `r-${r.id}`,
      data: r.data.slice(0, 10),
      titulo: r.titulo,
      rotulo: "Reunião de pais",
      tom: "sucesso" as Tom,
      icone: "people-outline" as NomeIcone,
      horario: r.horario + (r.duracao ? ` · ${r.duracao} min` : ""),
      detalhes: [r.local, r.turma ? `Turma ${r.turma.nome}` : "Toda a escola", r.escola.nome].filter((x): x is string => !!x),
      descricao: [r.finalidade, r.descricao].filter(Boolean).join("\n") || null,
      cancelado: r.status === "CANCELADA",
    })),
    ...a.plantoes.map((p) => ({
      chave: `p-${p.id}`,
      data: p.data.slice(0, 10),
      titulo: p.descricao || "Plantão pedagógico",
      rotulo: "Plantão pedagógico",
      tom: "neutro" as Tom,
      icone: "chatbubbles-outline" as NomeIcone,
      horario: `${p.horarioInicio}–${p.horarioFim}`,
      detalhes: [p.local, p.turma ? `Turma ${p.turma.nome}` : null, p.escola.nome].filter((x): x is string => !!x),
      descricao: null,
      cancelado: false,
    })),
  ];
  return itens.sort((x, y) => x.data.localeCompare(y.data) || (x.horario ?? "").localeCompare(y.horario ?? ""));
}

function agrupar<T extends { data: string }>(itens: T[]): Array<[string, T[]]> {
  const mapa = new Map<string, T[]>();
  for (const i of itens) mapa.set(i.data, [...(mapa.get(i.data) ?? []), i]);
  return [...mapa.entries()];
}

function rotuloDia(data: string): string {
  const hoje = hojeISO();
  const amanha = new Date(new Date(`${hoje}T12:00:00Z`).getTime() + 86400000).toISOString().slice(0, 10);
  const base = dataPorExtenso(data);
  return data === hoje ? `Hoje · ${base}` : data === amanha ? `Amanhã · ${base}` : base;
}

export function CartaoAgenda({ item }: { item: ItemAgenda }) {
  return (
    <Cartao style={{ flexDirection: "row", gap: espaco.md, alignItems: "flex-start" }}>
      <View style={s.icone}><Ionicons name={item.icone} size={20} color={cores.marca} /></View>
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: "row", gap: espaco.sm, flexWrap: "wrap" }}>
          <Selo texto={item.rotulo} tom={item.tom} />
          {item.cancelado ? <Selo texto="Cancelada" tom="perigo" /> : null}
        </View>
        <Text style={[s.titulo, item.cancelado && { textDecorationLine: "line-through" }]}>{item.titulo}</Text>
        {item.horario ? <Texto pequeno negrito>{item.horario}</Texto> : null}
        {item.detalhes.length ? <Texto pequeno suave>{item.detalhes.join(" · ")}</Texto> : null}
        {item.descricao ? <Texto pequeno>{item.descricao}</Texto> : null}
      </View>
    </Cartao>
  );
}

export function AgendaScreen({ navigation }: Props) {
  const { usuario } = useAuth();
  const mostraCardapio = usuario?.role === "RESPONSAVEL" || usuario?.role === "USER";
  const [aba, setAba] = useState<"agenda" | "cardapio">("agenda");
  const agenda = useQuery({ queryKey: ["agenda"], queryFn: () => comumApi.agenda(60) });
  const cardapio = useQuery({ queryKey: ["cardapio"], queryFn: comumApi.cardapio, enabled: mostraCardapio && aba === "cardapio" });
  const atual = aba === "agenda" ? agenda : cardapio;

  return (
    <Tela
      atualizando={atual.isRefetching}
      aoAtualizar={() => atual.refetch()}
      cabecalho={
        <Cabecalho
          aoVoltar={navigation.canGoBack() ? () => navigation.goBack() : undefined}
          titulo="Agenda"
          subtitulo={aba === "agenda" ? "Próximos 60 dias da escola" : "Merenda escolar da semana"}
        />
      }
    >
      {mostraCardapio ? (
        <Segmentos
          rotulo="Agenda ou cardápio"
          opcoes={[{ valor: "agenda", rotulo: "Agenda" }, { valor: "cardapio", rotulo: "Cardápio" }]}
          valor={aba}
          aoMudar={setAba}
        />
      ) : null}
      {aba === "agenda" ? <ListaAgenda q={agenda} /> : <ListaCardapio q={cardapio} />}
    </Tela>
  );
}

function ListaAgenda({ q }: { q: UseQueryResult<Agenda> }) {
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const itens = itensDaAgenda(q.data);
  if (itens.length === 0) return <Vazio texto="Nada agendado para os próximos dias." />;
  return (
    <>
      {agrupar(itens).map(([data, lista]) => (
        <View key={data} style={{ gap: espaco.sm }}>
          <Text style={s.dia}>{rotuloDia(data)}</Text>
          {lista.map((i) => <CartaoAgenda key={i.chave} item={i} />)}
        </View>
      ))}
      <Texto pequeno suave centro>Eventos que se repetem toda semana ainda não aparecem aqui.</Texto>
    </>
  );
}

function ListaCardapio({ q }: { q: UseQueryResult<CardapioSemana> }) {
  if (q.isPending) return <Carregando />;
  if (q.isError) return <Erro erro={q.error} tentarDeNovo={() => q.refetch()} />;
  const r = q.data.refeicoes.map((x) => ({ ...x, data: x.data.slice(0, 10) }));
  if (r.length === 0) return <Vazio texto="O cardápio desta semana ainda não foi publicado." />;
  const variasEscolas = new Set(r.map((x) => x.escola?.nome ?? "")).size > 1;
  return (
    <>
      {agrupar(r).map(([data, lista]) => (
        <View key={data} style={{ gap: espaco.sm }}>
          <Text style={s.dia}>{rotuloDia(data)}</Text>
          <Cartao style={{ gap: espaco.md }}>
            {lista.map((x, i) => (
              <View key={x.id} style={[{ gap: 2 }, i > 0 && s.divisor]}>
                <Texto pequeno suave>
                  {rotuloRefeicao[x.tipoRefeicao] ?? capitalizar(x.tipoRefeicao)} · {capitalizar(x.turno)}
                  {variasEscolas ? ` · ${x.escola?.nome ?? "Rede"}` : ""}
                </Texto>
                <Text style={s.titulo}>{x.descricao}</Text>
                {x.observacoesNutricionais ? <Texto pequeno suave>{x.observacoesNutricionais}</Texto> : null}
              </View>
            ))}
          </Cartao>
        </View>
      ))}
    </>
  );
}

const s = StyleSheet.create({
  icone: { width: 40, height: 40, borderRadius: raio.md, backgroundColor: cores.marcaSuave, alignItems: "center", justifyContent: "center" },
  titulo: { fontFamily: fontes.negrito, fontSize: 16, lineHeight: 21, color: cores.texto },
  dia: { fontFamily: fontes.negrito, fontSize: 14, color: cores.textoSuave, textTransform: "uppercase", letterSpacing: 0.5, marginTop: espaco.sm },
  divisor: { borderTopWidth: 1, borderTopColor: cores.divisor, paddingTop: espaco.md },
});
