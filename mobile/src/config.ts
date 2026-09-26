import { Platform } from "react-native";

/**
 * URL da API. Em desenvolvimento, o emulador Android enxerga a máquina
 * pelo 10.0.2.2 (a API de dev fica só em 127.0.0.1:3051 — ver docs/MAPA_PORTAS.md).
 * Em build de produção, defina EXPO_PUBLIC_API_URL (HTTPS obrigatório).
 */
const padraoDev = Platform.OS === "android" ? "http://10.0.2.2:3051" : "http://localhost:3051";

export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? padraoDev).replace(/\/$/, "");

if (!__DEV__ && !API_URL.startsWith("https://")) {
  // Build de produção nunca fala com a API sem TLS
  throw new Error("EXPO_PUBLIC_API_URL precisa ser https:// em produção");
}

/**
 * Link opcional para a política de privacidade oficial da prefeitura
 * (EXPO_PUBLIC_POLITICA_PRIVACIDADE_URL). Só é exibido se for https://.
 */
const politica = process.env.EXPO_PUBLIC_POLITICA_PRIVACIDADE_URL ?? "";
export const POLITICA_PRIVACIDADE_URL = politica.startsWith("https://") ? politica : null;
