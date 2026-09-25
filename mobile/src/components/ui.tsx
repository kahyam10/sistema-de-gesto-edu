import { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cores, espaco, fontes, raio } from "../theme";
import { iniciais } from "../utils/formato";

export type NomeIcone = keyof typeof Ionicons.glyphMap;
export type Tom = "neutro" | "sucesso" | "alerta" | "perigo" | "marca";

const TONS: Record<Tom, { fundo: string; texto: string }> = {
  neutro: { fundo: cores.fundo, texto: "#3B4642" },
  sucesso: { fundo: cores.sucessoSuave, texto: cores.sucesso },
  alerta: { fundo: cores.alertaSuave, texto: cores.alertaTexto },
  perigo: { fundo: cores.perigoSuave, texto: cores.perigoTexto },
  marca: { fundo: cores.marcaSuave, texto: cores.marcaSuaveTexto },
};

// ---------- Estrutura da tela ----------

/**
 * Tela padrão: cabeçalho azul que rola junto com o conteúdo, faixa azul fixa
 * atrás da barra de status e rodapé opcional fixo (ex.: botão Salvar).
 * `sobrepor` puxa o conteúdo para cima do cabeçalho (cartões de resumo).
 */
export function Tela({
  children, cabecalho, rodape, sobrepor, atualizando, aoAtualizar,
}: {
  children: ReactNode;
  cabecalho?: ReactNode;
  rodape?: ReactNode;
  sobrepor?: boolean;
  atualizando?: boolean;
  aoAtualizar?: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.tela}>
      {cabecalho ? <View style={{ height: insets.top, backgroundColor: cores.marca }} /> : null}
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: espaco.xl, paddingTop: cabecalho ? 0 : insets.top }}
        refreshControl={
          aoAtualizar ? (
            <RefreshControl refreshing={!!atualizando} onRefresh={aoAtualizar} colors={[cores.marca]} />
          ) : undefined
        }
      >
        {cabecalho}
        <View style={[s.conteudo, sobrepor && { marginTop: -44, paddingTop: 0 }]}>{children}</View>
      </ScrollView>
      {rodape ? <View style={s.rodape}>{rodape}</View> : null}
    </View>
  );
}

export function Cabecalho({
  titulo, sobretitulo, subtitulo, aoVoltar, rotuloVoltar = "Voltar", sobreposto, topo, esquerda,
}: {
  titulo: string;
  sobretitulo?: string;
  subtitulo?: string;
  aoVoltar?: () => void;
  rotuloVoltar?: string;
  /** Deixa espaço embaixo para cartões que sobem sobre o cabeçalho (Tela sobrepor). */
  sobreposto?: boolean;
  /** Linha pequena acima do título (ex.: "GESTÃO EDUCACIONAL · Sex, 25 set"). */
  topo?: ReactNode;
  /** Elemento à esquerda do título (ex.: Avatar). */
  esquerda?: ReactNode;
}) {
  return (
    <View style={[s.cabecalho, { paddingTop: aoVoltar ? espaco.sm : espaco.xl, paddingBottom: sobreposto ? 64 : 22 }]}>
      {aoVoltar && (
        <Pressable onPress={aoVoltar} accessibilityRole="button" accessibilityLabel={rotuloVoltar} hitSlop={8} style={s.voltar}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
      )}
      {topo}
      <View style={s.cabecalhoCorpo}>
        {esquerda}
        <View style={{ flex: 1, gap: 3 }}>
          {sobretitulo ? <Text style={s.sobretitulo}>{sobretitulo.toUpperCase()}</Text> : null}
          <Text style={s.cabecalhoTitulo} accessibilityRole="header">{titulo}</Text>
          {subtitulo ? <Text style={s.cabecalhoSub}>{subtitulo}</Text> : null}
        </View>
      </View>
    </View>
  );
}

/** Linha "GESTÃO EDUCACIONAL ........ Sex, 25 de setembro" do topo das telas iniciais. */
export function TopoCabecalho({ direita }: { direita: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: espaco.sm }}>
      <Text style={s.sobretitulo}>GESTÃO EDUCACIONAL</Text>
      <Text style={[s.cabecalhoSub, { color: cores.cabecalhoRotulo, fontSize: 14 }]}>{direita}</Text>
    </View>
  );
}

// ---------- Blocos ----------

export function Cartao({
  children, style, onPress, rotulo,
}: { children: ReactNode; style?: ViewStyle; onPress?: () => void; rotulo?: string }) {
  if (!onPress) return <View style={[s.cartao, style]}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
      style={({ pressed }) => [s.cartao, style, { opacity: pressed ? 0.85 : 1 }]}
    >
      {children}
    </Pressable>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={s.titulo} accessibilityRole="header">{children}</Text>;
}
export function Subtitulo({ children, linhas }: { children: ReactNode; linhas?: number }) {
  return <Text style={s.subtitulo} numberOfLines={linhas}>{children}</Text>;
}
export function Rotulo({ children }: { children: ReactNode }) {
  return <Text style={s.rotulo}>{children}</Text>;
}
export function Texto({ children, suave, pequeno, negrito, cor, centro, linhas }: {
  children: ReactNode; suave?: boolean; pequeno?: boolean; negrito?: boolean; cor?: string; centro?: boolean; linhas?: number;
}) {
  return (
    <Text
      numberOfLines={linhas}
      style={[
        s.texto,
        pequeno && { fontSize: 13, lineHeight: 18 },
        suave && { color: cores.textoSuave },
        negrito && { fontFamily: fontes.negrito },
        cor ? { color: cor } : null,
        centro && { textAlign: "center" },
      ]}
    >
      {children}
    </Text>
  );
}

/** Cabeçalho de seção com ação opcional à direita ("Ver todos"). */
export function Secao({ titulo, acao, aoAcionar }: { titulo: string; acao?: string; aoAcionar?: () => void }) {
  return (
    <View style={s.secao}>
      <Titulo>{titulo}</Titulo>
      {acao && aoAcionar ? (
        <Pressable onPress={aoAcionar} accessibilityRole="button" style={s.secaoAcao} hitSlop={6}>
          <Text style={s.link}>{acao}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Botao({
  titulo, onPress, carregando, variante = "primario", desabilitado, icone, compacto,
}: {
  titulo: string; onPress: () => void; carregando?: boolean;
  variante?: "primario" | "secundario" | "perigo" | "tracejado"; desabilitado?: boolean;
  icone?: NomeIcone; compacto?: boolean;
}) {
  const estilos = {
    primario: { bg: cores.marca, fg: "#fff", borda: cores.marca, tipo: "solid" as const },
    secundario: { bg: cores.superficie, fg: cores.marca, borda: cores.marcaBorda, tipo: "solid" as const },
    tracejado: { bg: cores.superficie, fg: cores.marca, borda: "#7F9AD3", tipo: "dashed" as const },
    perigo: { bg: cores.superficie, fg: cores.perigoTexto, borda: cores.perigoBorda, tipo: "solid" as const },
  }[variante];
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [
        s.botao,
        compacto && { minHeight: 44, paddingHorizontal: espaco.md },
        {
          backgroundColor: estilos.bg, borderColor: estilos.borda, borderStyle: estilos.tipo,
          opacity: inativo ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={estilos.fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: espaco.sm }}>
          {icone ? <Ionicons name={icone} size={20} color={estilos.fg} /> : null}
          <Text style={[s.botaoTexto, compacto && { fontSize: 14 }, { color: estilos.fg }]}>{titulo}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function Campo({ rotulo, erro, ...props }: TextInputProps & { rotulo: string; erro?: string | null }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.campoRotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor={cores.textoApagado}
        accessibilityLabel={rotulo}
        style={[s.campo, erro ? s.campoErro : null]}
        {...props}
      />
      {erro ? <Text style={s.campoMsgErro}>{erro}</Text> : null}
    </View>
  );
}

export function Selo({ texto, tom = "neutro" }: { texto: string; tom?: Tom }) {
  const t = TONS[tom];
  return (
    <View style={[s.selo, { backgroundColor: t.fundo }]}>
      <Text style={[s.seloTexto, { color: t.texto }]}>{texto}</Text>
    </View>
  );
}

/** Faixa de aviso (sucesso, alerta, erro) com ícone. */
export function Aviso({ texto, tom = "sucesso" }: { texto: string; tom?: "sucesso" | "alerta" | "perigo" }) {
  const t = TONS[tom];
  const icone: NomeIcone = tom === "sucesso" ? "checkmark-circle-outline" : "warning-outline";
  return (
    <View style={[s.aviso, { backgroundColor: t.fundo }]} accessibilityLiveRegion="polite">
      <Ionicons name={icone} size={22} color={t.texto} />
      <Text style={[s.avisoTexto, { color: t.texto }]}>{texto}</Text>
    </View>
  );
}

/** Número grande com legenda (cartões de resumo). */
export function Estatistica({
  valor, rotulo, tom, destaque, centro,
}: { valor: string | number; rotulo: string; tom?: Tom; destaque?: boolean; centro?: boolean }) {
  const t = tom ? TONS[tom] : null;
  return (
    <View style={[s.estat, { backgroundColor: t ? t.fundo : cores.fundo }, centro && { alignItems: "center" }]}>
      <Text style={[s.estatRotulo, t && { color: t.texto }]}>{rotulo}</Text>
      <Text
        style={[
          destaque ? s.estatValorGrande : s.estatValor,
          { color: t ? t.texto : cores.marcaEscura },
        ]}
      >
        {valor}
      </Text>
    </View>
  );
}

export function Avatar({ nome, tamanho = 48, invertido }: { nome: string; tamanho?: number; invertido?: boolean }) {
  return (
    <View
      accessible={false}
      style={{
        width: tamanho, height: tamanho, borderRadius: tamanho / 2, alignItems: "center", justifyContent: "center",
        backgroundColor: invertido ? "#fff" : cores.marcaSuave,
      }}
    >
      <Text style={{ fontFamily: fontes.negrito, fontSize: tamanho * 0.36, color: invertido ? cores.marca : cores.marcaSuaveTexto }}>
        {iniciais(nome)}
      </Text>
    </View>
  );
}

/** Grupo de opções exclusivas (abas, bimestre, tipo). */
export function Segmentos<T extends string | number>({
  opcoes, valor, aoMudar, colunas, papel = "tab", rotulo,
}: {
  opcoes: Array<{ valor: T; rotulo: string }>;
  valor: T;
  aoMudar: (v: T) => void;
  colunas?: number;
  papel?: "tab" | "radio";
  rotulo?: string;
}) {
  return (
    <View
      accessibilityRole={papel === "tab" ? "tablist" : "radiogroup"}
      accessibilityLabel={rotulo}
      style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
    >
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <Pressable
            key={String(o.valor)}
            onPress={() => aoMudar(o.valor)}
            accessibilityRole={papel}
            accessibilityState={{ selected: ativo }}
            style={[
              s.segmento,
              colunas ? { flexBasis: `${100 / colunas - 2}%`, flexGrow: 1 } : { flexGrow: 1 },
              ativo && s.segmentoAtivo,
            ]}
          >
            <Text style={[s.segmentoTexto, ativo && { color: "#fff" }]} numberOfLines={1}>{o.rotulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Barra horizontal (0–100) com marcador opcional (ex.: mínimo de 75%). */
export function Barra({ percentual, cor = cores.marca, marcador, altura = 8 }: {
  percentual: number; cor?: string; marcador?: number; altura?: number;
}) {
  const p = Math.max(0, Math.min(100, percentual));
  return (
    <View style={{ height: altura, borderRadius: 999, backgroundColor: cores.borda }}>
      <View style={{ width: `${p}%`, height: altura, borderRadius: 999, backgroundColor: cor }} />
      {marcador !== undefined ? (
        <View style={{ position: "absolute", left: `${marcador}%`, top: -5, width: 2, height: altura + 10, backgroundColor: cores.texto }} />
      ) : null}
    </View>
  );
}

export function Carregando() {
  return (
    <View style={s.centro}>
      <ActivityIndicator size="large" color={cores.marca} />
    </View>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <View style={s.vazio}>
      <Text style={[s.texto, { color: cores.textoSuave, textAlign: "center" }]}>{texto}</Text>
    </View>
  );
}

export function Erro({ erro, tentarDeNovo }: { erro: unknown; tentarDeNovo?: () => void }) {
  const msg = erro instanceof Error ? erro.message : "Algo deu errado.";
  return (
    <View style={[s.centro, { gap: espaco.md, padding: espaco.xl }]}>
      <Text style={[s.texto, { textAlign: "center" }]}>{msg}</Text>
      {tentarDeNovo && <Botao titulo="Tentar de novo" variante="secundario" onPress={tentarDeNovo} />}
    </View>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.md },
  rodape: {
    paddingHorizontal: espaco.lg, paddingTop: espaco.md, paddingBottom: espaco.md, gap: 6,
    backgroundColor: cores.fundo, borderTopWidth: 1, borderTopColor: cores.borda,
  },
  cabecalho: { backgroundColor: cores.marca, paddingHorizontal: espaco.sm + espaco.md, gap: 6 },
  voltar: { width: 44, height: 44, marginLeft: -espaco.md, alignItems: "center", justifyContent: "center", borderRadius: raio.md },
  cabecalhoCorpo: { flexDirection: "row", alignItems: "center", gap: 14 },
  sobretitulo: { fontFamily: fontes.negrito, fontSize: 13, letterSpacing: 1, color: cores.cabecalhoRotulo },
  cabecalhoTitulo: { fontFamily: fontes.titulo, fontSize: 26, lineHeight: 31, color: "#fff" },
  cabecalhoSub: { fontFamily: fontes.regular, fontSize: 15, lineHeight: 20, color: cores.cabecalhoTexto },
  cartao: {
    backgroundColor: cores.superficie, borderRadius: raio.lg, padding: espaco.lg,
    borderWidth: 1, borderColor: cores.borda, gap: espaco.md,
  },
  titulo: { fontFamily: fontes.titulo, fontSize: 20, lineHeight: 25, color: cores.texto },
  subtitulo: { fontFamily: fontes.negrito, fontSize: 17, lineHeight: 22, color: cores.texto },
  rotulo: { fontFamily: fontes.negrito, fontSize: 13, color: cores.textoSuave, textTransform: "uppercase", letterSpacing: 0.6 },
  texto: { fontFamily: fontes.regular, fontSize: 15, color: cores.texto, lineHeight: 21 },
  secao: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: espaco.sm },
  secaoAcao: { minHeight: 44, justifyContent: "center", paddingHorizontal: espaco.xs },
  link: { fontFamily: fontes.negrito, fontSize: 15, color: cores.marca },
  botao: {
    minHeight: 52, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: espaco.lg,
  },
  botaoTexto: { fontFamily: fontes.negrito, fontSize: 16 },
  campoRotulo: { fontFamily: fontes.negrito, fontSize: 14, color: cores.texto },
  campo: {
    minHeight: 48, borderWidth: 1, borderColor: cores.bordaCampo, borderRadius: 10,
    paddingHorizontal: espaco.md, fontSize: 16, fontFamily: fontes.regular, color: cores.texto, backgroundColor: cores.superficie,
  },
  campoErro: { borderWidth: 2, borderColor: cores.perigo, backgroundColor: "#FFF6F3" },
  campoMsgErro: { fontFamily: fontes.negrito, fontSize: 13, color: cores.perigoTexto },
  selo: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  seloTexto: { fontFamily: fontes.negrito, fontSize: 13 },
  aviso: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  avisoTexto: { flex: 1, fontFamily: fontes.negrito, fontSize: 15, lineHeight: 20 },
  estat: { flex: 1, borderRadius: raio.md, padding: espaco.md, gap: 2 },
  estatRotulo: { fontFamily: fontes.regular, fontSize: 13, color: cores.textoSuave },
  estatValor: { fontFamily: fontes.negrito, fontSize: 22 },
  estatValorGrande: { fontFamily: fontes.titulo, fontSize: 30, lineHeight: 36 },
  segmento: {
    minHeight: 46, paddingHorizontal: 12, borderRadius: raio.md, alignItems: "center", justifyContent: "center",
    backgroundColor: cores.superficie, borderWidth: 1, borderColor: "#D5DBD8",
  },
  segmentoAtivo: { backgroundColor: cores.marca, borderColor: cores.marca },
  segmentoTexto: { fontFamily: fontes.negrito, fontSize: 15, color: cores.texto },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: cores.fundo },
  vazio: { alignItems: "center", justifyContent: "center", paddingVertical: espaco.xl * 2, paddingHorizontal: espaco.lg },
});
