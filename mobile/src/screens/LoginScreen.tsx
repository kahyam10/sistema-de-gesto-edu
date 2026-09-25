import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { Botao, Campo } from "../components/ui";
import { cores, espaco, fontes } from "../theme";

export function LoginScreen() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!email || !senha) {
      setErro("Informe e-mail e senha.");
      return;
    }
    setCarregando(true);
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível entrar.");
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={s.tela}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.corpo}>
        <View style={s.marca}>
          <Text style={s.sobretitulo}>GESTÃO EDUCACIONAL</Text>
          <Text style={s.nome}>Ibirapitanga · BA</Text>
          <Text style={s.descricao}>Acompanhe boletim, frequência e comunicados — ou registre a chamada da sua turma.</Text>
        </View>
        <View style={s.form}>
          <Campo
            rotulo="E-mail"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            placeholder="seu.email@exemplo.com"
          />
          <Campo
            rotulo="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            onSubmitEditing={enviar}
          />
          {erro && <Text style={s.erro} accessibilityLiveRegion="polite">{erro}</Text>}
          <Botao titulo="Entrar" onPress={enviar} carregando={carregando} />
          <Text style={s.ajuda}>Não tem acesso? Procure a secretaria da escola.</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.marcaEscura },
  corpo: { flex: 1, justifyContent: "flex-end" },
  marca: { padding: espaco.xl, gap: espaco.sm },
  sobretitulo: { color: "#9FB6E6", fontSize: 13, fontFamily: fontes.negrito, letterSpacing: 1 },
  nome: { color: "#fff", fontSize: 30, fontFamily: fontes.titulo },
  descricao: { color: "#C9D6F0", fontSize: 16, lineHeight: 22, fontFamily: fontes.regular },
  form: {
    backgroundColor: cores.superficie, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: espaco.xl, gap: espaco.lg,
  },
  erro: { color: cores.perigoTexto, fontSize: 14, fontFamily: fontes.negrito },
  ajuda: { color: cores.textoSuave, fontSize: 13, textAlign: "center", fontFamily: fontes.regular },
});
