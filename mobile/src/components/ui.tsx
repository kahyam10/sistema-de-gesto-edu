import { ReactNode } from "react";
import {
  ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { cores, espaco, raio } from "../theme";

export function Tela({
  children, atualizando, aoAtualizar, rolavel = true,
}: { children: ReactNode; atualizando?: boolean; aoAtualizar?: () => void; rolavel?: boolean }) {
  if (!rolavel) {
    return <SafeAreaView edges={["bottom"]} style={s.tela}>{children}</SafeAreaView>;
  }
  return (
    <SafeAreaView edges={["bottom"]} style={s.tela}>
      <ScrollView
        contentContainerStyle={s.conteudo}
        refreshControl={
          aoAtualizar ? <RefreshControl refreshing={!!atualizando} onRefresh={aoAtualizar} /> : undefined
        }
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Cartao({ children, style, onPress }: { children: ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const conteudo = <View style={[s.cartao, style]}>{children}</View>;
  if (!onPress) return conteudo;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
      {conteudo}
    </Pressable>
  );
}

export function Titulo({ children }: { children: ReactNode }) {
  return <Text style={s.titulo}>{children}</Text>;
}
export function Subtitulo({ children }: { children: ReactNode }) {
  return <Text style={s.subtitulo}>{children}</Text>;
}
export function Rotulo({ children }: { children: ReactNode }) {
  return <Text style={s.rotulo}>{children}</Text>;
}
export function Texto({ children, suave }: { children: ReactNode; suave?: boolean }) {
  return <Text style={[s.texto, suave && { color: cores.textoSuave }]}>{children}</Text>;
}

export function Botao({
  titulo, onPress, carregando, variante = "primario", desabilitado,
}: {
  titulo: string; onPress: () => void; carregando?: boolean;
  variante?: "primario" | "secundario" | "perigo"; desabilitado?: boolean;
}) {
  const bg = variante === "primario" ? cores.marca : variante === "perigo" ? cores.perigoSuave : cores.marcaSuave;
  const fg = variante === "primario" ? "#fff" : variante === "perigo" ? cores.perigo : cores.marcaSuaveTexto;
  const inativo = desabilitado || carregando;
  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      style={({ pressed }) => [s.botao, { backgroundColor: bg, opacity: inativo ? 0.6 : pressed ? 0.85 : 1 }]}
    >
      {carregando ? <ActivityIndicator color={fg} /> : <Text style={[s.botaoTexto, { color: fg }]}>{titulo}</Text>}
    </Pressable>
  );
}

export function Campo({ rotulo, ...props }: TextInputProps & { rotulo: string }) {
  return (
    <View style={{ gap: espaco.xs }}>
      <Rotulo>{rotulo}</Rotulo>
      <TextInput placeholderTextColor={cores.textoSuave} style={s.campo} {...props} />
    </View>
  );
}

export function Selo({ texto, tom = "neutro" }: { texto: string; tom?: "neutro" | "sucesso" | "alerta" | "perigo" | "marca" }) {
  const mapa = {
    neutro: [cores.fundo, cores.textoSuave],
    sucesso: [cores.sucessoSuave, cores.sucesso],
    alerta: [cores.alertaSuave, cores.alerta],
    perigo: [cores.perigoSuave, cores.perigo],
    marca: [cores.marcaSuave, cores.marcaSuaveTexto],
  } as const;
  const [bg, fg] = mapa[tom];
  return (
    <View style={[s.selo, { backgroundColor: bg }]}>
      <Text style={[s.seloTexto, { color: fg }]}>{texto}</Text>
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
    <View style={[s.centro, { paddingVertical: espaco.xl * 2 }]}>
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
  cartao: {
    backgroundColor: cores.superficie, borderRadius: raio.md, padding: espaco.lg,
    borderWidth: 1, borderColor: cores.borda, gap: espaco.sm,
  },
  titulo: { fontSize: 20, fontWeight: "700", color: cores.texto },
  subtitulo: { fontSize: 16, fontWeight: "600", color: cores.texto },
  rotulo: { fontSize: 12, fontWeight: "600", color: cores.textoSuave, textTransform: "uppercase", letterSpacing: 0.5 },
  texto: { fontSize: 15, color: cores.texto, lineHeight: 21 },
  botao: { minHeight: 48, borderRadius: raio.sm, alignItems: "center", justifyContent: "center", paddingHorizontal: espaco.lg },
  botaoTexto: { fontSize: 16, fontWeight: "600" },
  campo: {
    minHeight: 48, borderWidth: 1, borderColor: cores.borda, borderRadius: raio.sm,
    paddingHorizontal: espaco.md, fontSize: 16, color: cores.texto, backgroundColor: cores.superficie,
  },
  selo: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  seloTexto: { fontSize: 12, fontWeight: "600" },
  centro: { flex: 1, alignItems: "center", justifyContent: "center" },
});
