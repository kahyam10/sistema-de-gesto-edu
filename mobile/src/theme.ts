// Mesma família de cores do dashboard (DESIGN_BASE): azul institucional + neutros.
// Tons de texto escurecidos para manter contraste ≥ 4.5:1 também sobre o fundo cinza.
export const cores = {
  marca: "#0C3FA0",
  marcaEscura: "#0A2761",
  marcaSuave: "#E7EEFB",
  marcaSuaveTexto: "#072B73",
  marcaBorda: "#B9C9EA",
  cabecalhoRotulo: "#C9D8F5",
  cabecalhoTexto: "#DCE6F8",
  fundo: "#F4F6FA",
  superficie: "#FFFFFF",
  borda: "#E3E7E4",
  bordaCampo: "#C3CAC6",
  divisor: "#EEF1EF",
  texto: "#1A2421",
  textoSuave: "#5E6B66",
  textoApagado: "#6B7872",
  sucesso: "#0A6142",
  sucessoSuave: "#DFF1E8",
  alerta: "#8B5A06",
  alertaTexto: "#7A4F05",
  alertaSuave: "#FCEED2",
  perigo: "#C8391F",
  perigoTexto: "#A52C17",
  perigoSuave: "#FCEAE4",
  perigoBorda: "#F0C9BF",
} as const;

// Carregadas no App.tsx (expo-font). Com fonte customizada o fontWeight não
// escolhe o peso: cada peso é uma família.
export const fontes = {
  regular: "AtkinsonHyperlegible_400Regular",
  negrito: "AtkinsonHyperlegible_700Bold",
  titulo: "BricolageGrotesque_700Bold",
} as const;

export const espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const raio = { sm: 8, md: 12, lg: 16 } as const;

/** Presença abaixo disto gera alerta (mesmo limite do backend: frequencia.service). */
export const LIMITE_PRESENCA = 75;
