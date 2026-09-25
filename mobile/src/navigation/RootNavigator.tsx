import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator, BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { professorApi, responsavelApi } from "../api/endpoints";
import { Carregando, NomeIcone } from "../components/ui";
import { LoginScreen } from "../screens/LoginScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { SemAcessoScreen } from "../screens/SemAcessoScreen";
import { InicioProfessorScreen } from "../screens/professor/InicioProfessorScreen";
import { TurmasScreen } from "../screens/professor/TurmasScreen";
import { TurmaScreen } from "../screens/professor/TurmaScreen";
import { ChamadaScreen } from "../screens/professor/ChamadaScreen";
import { NotasScreen } from "../screens/professor/NotasScreen";
import { NovaAvaliacaoScreen } from "../screens/professor/NovaAvaliacaoScreen";
import { LancarNotasScreen } from "../screens/professor/LancarNotasScreen";
import { MeusAlunosScreen } from "../screens/responsavel/MeusAlunosScreen";
import { AlunoScreen } from "../screens/responsavel/AlunoScreen";
import { ComunicadosScreen } from "../screens/responsavel/ComunicadosScreen";
import { ComunicadoScreen } from "../screens/responsavel/ComunicadoScreen";
import type { ProfessorStack, ResponsavelStack } from "./tipos";
import { cores, fontes } from "../theme";

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: cores.marca, background: cores.fundo } };
// O cabeçalho azul faz parte de cada tela (componente Cabecalho), não da navegação
const semCabecalho = { headerShown: false } as const;

const Tabs = createBottomTabNavigator();
const PStack = createNativeStackNavigator<ProfessorStack>();
const RStack = createNativeStackNavigator<ResponsavelStack>();

// ---------- Professor: Hoje · Turmas · Perfil ----------

function ProfessorHoje() {
  return (
    <PStack.Navigator screenOptions={semCabecalho}>
      <PStack.Screen name="Inicio" component={InicioProfessorScreen} />
      <PStack.Screen name="Chamada" component={ChamadaScreen} />
    </PStack.Navigator>
  );
}

function ProfessorTurmas() {
  return (
    <PStack.Navigator screenOptions={semCabecalho}>
      <PStack.Screen name="Turmas" component={TurmasScreen} />
      <PStack.Screen name="Turma" component={TurmaScreen} />
      <PStack.Screen name="Chamada" component={ChamadaScreen} />
      <PStack.Screen name="Notas" component={NotasScreen} />
      <PStack.Screen name="NovaAvaliacao" component={NovaAvaliacaoScreen} />
      <PStack.Screen name="LancarNotas" component={LancarNotasScreen} />
    </PStack.Navigator>
  );
}

// ---------- Responsável: Início · Comunicados · Perfil ----------

function ResponsavelInicio() {
  return (
    <RStack.Navigator screenOptions={semCabecalho}>
      <RStack.Screen name="Inicio" component={MeusAlunosScreen} />
      <RStack.Screen name="Aluno" component={AlunoScreen} />
      <RStack.Screen name="Comunicado" component={ComunicadoScreen} />
    </RStack.Navigator>
  );
}

function ResponsavelComunicados() {
  return (
    <RStack.Navigator screenOptions={semCabecalho}>
      <RStack.Screen name="Comunicados" component={ComunicadosScreen} />
      <RStack.Screen name="Comunicado" component={ComunicadoScreen} />
    </RStack.Navigator>
  );
}

const icone = (nome: NomeIcone) => ({ color, size }: { color: string; size: number }) => (
  <Ionicons name={nome} color={color} size={size} />
);
const abas: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: cores.marca,
  tabBarInactiveTintColor: cores.textoSuave,
  tabBarLabelStyle: { fontFamily: fontes.negrito, fontSize: 12 },
  tabBarStyle: { borderTopColor: cores.borda },
  tabBarBadgeStyle: { backgroundColor: cores.perigo, fontFamily: fontes.negrito, fontSize: 11 },
};

function AppProfessor() {
  // Mesmo cache da tela Hoje: o selo some assim que a chamada é registrada
  const resumo = useQuery({ queryKey: ["professor", "resumo"], queryFn: professorApi.resumo });
  const pendentes = resumo.data?.frequenciasPendentesHoje.length ?? 0;
  return (
    <Tabs.Navigator screenOptions={abas}>
      <Tabs.Screen name="TabHoje" component={ProfessorHoje}
        options={{ title: "Hoje", tabBarIcon: icone("calendar-outline"), tabBarBadge: pendentes || undefined }} />
      <Tabs.Screen name="TabTurmas" component={ProfessorTurmas}
        options={{ title: "Turmas", tabBarIcon: icone("people-outline") }} />
      <Tabs.Screen name="TabPerfil" component={PerfilScreen}
        options={{ title: "Perfil", tabBarIcon: icone("person-circle-outline") }} />
    </Tabs.Navigator>
  );
}

function AppResponsavel() {
  const comunicados = useQuery({ queryKey: ["comunicados"], queryFn: responsavelApi.comunicados });
  const naoLidos = comunicados.data?.filter((c) => !c.lido).length ?? 0;
  return (
    <Tabs.Navigator screenOptions={abas}>
      <Tabs.Screen name="TabInicio" component={ResponsavelInicio}
        options={{ title: "Início", tabBarIcon: icone("home-outline") }} />
      <Tabs.Screen name="TabComunicados" component={ResponsavelComunicados}
        options={{ title: "Comunicados", tabBarIcon: icone("notifications-outline"), tabBarBadge: naoLidos || undefined }} />
      <Tabs.Screen name="TabPerfil" component={PerfilScreen}
        options={{ title: "Perfil", tabBarIcon: icone("person-circle-outline") }} />
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { usuario, iniciando } = useAuth();
  if (iniciando) return <Carregando />;

  let conteudo;
  if (!usuario) conteudo = <LoginScreen />;
  else if (usuario.role === "PROFESSOR") conteudo = <AppProfessor />;
  else if (usuario.role === "RESPONSAVEL" || usuario.role === "USER") conteudo = <AppResponsavel />;
  else conteudo = <SemAcessoScreen />;

  return <NavigationContainer theme={tema}>{conteudo}</NavigationContainer>;
}
