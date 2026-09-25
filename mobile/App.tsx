import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { View } from "react-native";
import { useFonts } from "expo-font";
import { AtkinsonHyperlegible_400Regular } from "@expo-google-fonts/atkinson-hyperlegible/400Regular";
import { AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible/700Bold";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque/700Bold";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "./src/api/client";
import { AuthProvider } from "./src/auth/AuthContext";
import { RootNavigator } from "./src/navigation/RootNavigator";

export default function App() {
  // Só os 3 pesos usados (importar o pacote inteiro embutiria todas as variações)
  const [fontesProntas, erroFontes] = useFonts({
    AtkinsonHyperlegible_400Regular,
    AtkinsonHyperlegible_700Bold,
    BricolageGrotesque_700Bold,
  });
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            // Não insiste em erros de permissão/validação; só em falha de rede/servidor
            retry: (tentativas, erro) =>
              tentativas < 2 && (!(erro instanceof ApiError) || erro.status === 0 || erro.status >= 500),
          },
        },
      })
  );

  // Se as fontes falharem, segue com a fonte do sistema em vez de travar o app
  if (!fontesProntas && !erroFontes) return <View style={{ flex: 1, backgroundColor: "#0A2761" }} />;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
