import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { Carregando } from "../components/ui";
import { LoginScreen } from "../screens/LoginScreen";
import { PerfilScreen } from "../screens/PerfilScreen";
import { SemAcessoScreen } from "../screens/SemAcessoScreen";
import { InicioProfessorScreen } from "../screens/professor/InicioProfessorScreen";
import { TurmaScreen } from "../screens/professor/TurmaScreen";
import { ChamadaScreen } from "../screens/professor/ChamadaScreen";
import { NotasScreen } from "../screens/professor/NotasScreen";
import { NovaAvaliacaoScreen } from "../screens/professor/NovaAvaliacaoScreen";
import { LancarNotasScreen } from "../screens/professor/LancarNotasScreen";
import { MeusAlunosScreen } from "../screens/responsavel/MeusAlunosScreen";
import { AlunoScreen } from "../screens/responsavel/AlunoScreen";
import { ComunicadosScreen } from "../screens/responsavel/ComunicadosScreen";
import type { ProfessorStack, ResponsavelStack } from "./tipos";
import { cores } from "../theme";

const tema = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: cores.marca, background: cores.fundo } };
const cabecalho = {
  headerStyle: { backgroundColor: cores.marcaEscura },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
};

const Tabs = createBottomTabNavigator();
const PStack = createNativeStackNavigator<ProfessorStack>();
const RStack = createNativeStackNavigator<ResponsavelStack>();

function ProfessorInicio() {
  return (
    <PStack.Navigator screenOptions={cabecalho}>
      <PStack.Screen name="Inicio" component={InicioProfessorScreen} options={{ title: "Início" }} />
      <PStack.Screen name="Turma" component={TurmaScreen} options={({ route }) => ({ title: route.params.turmaNome })} />
      <PStack.Screen name="Chamada" component={ChamadaScreen} options={{ title: "Chamada" }} />
      <PStack.Screen name="Notas" component={NotasScreen} options={({ route }) => ({ title: `Notas · ${route.params.turmaNome}` })} />
      <PStack.Screen name="NovaAvaliacao" component={NovaAvaliacaoScreen} options={{ title: "Nova avaliação" }} />
      <PStack.Screen name="LancarNotas" component={LancarNotasScreen} options={{ title: "Lançar notas" }} />
    </PStack.Navigator>
  );
}

function ResponsavelAlunos() {
  return (
    <RStack.Navigator screenOptions={cabecalho}>
      <RStack.Screen name="Alunos" component={MeusAlunosScreen} options={{ title: "Meus alunos" }} />
      <RStack.Screen name="Aluno" component={AlunoScreen} options={({ route }) => ({ title: route.params.nomeAluno })} />
    </RStack.Navigator>
  );
}

type NomeIcone = keyof typeof Ionicons.glyphMap;
const icone = (nome: NomeIcone) => ({ color, size }: { color: string; size: number }) => (
  <Ionicons name={nome} color={color} size={size} />
);
const abas = {
  tabBarActiveTintColor: cores.marca,
  tabBarInactiveTintColor: cores.textoSuave,
};

function AppProfessor() {
  return (
    <Tabs.Navigator screenOptions={abas}>
      <Tabs.Screen name="TabInicio" component={ProfessorInicio}
        options={{ headerShown: false, title: "Turmas", tabBarIcon: icone("school-outline") }} />
      <Tabs.Screen name="TabPerfil" component={PerfilScreen}
        options={{ ...cabecalho, title: "Perfil", tabBarIcon: icone("person-circle-outline") }} />
    </Tabs.Navigator>
  );
}

function AppResponsavel() {
  return (
    <Tabs.Navigator screenOptions={abas}>
      <Tabs.Screen name="TabAlunos" component={ResponsavelAlunos}
        options={{ headerShown: false, title: "Alunos", tabBarIcon: icone("people-outline") }} />
      <Tabs.Screen name="TabComunicados" component={ComunicadosScreen}
        options={{ ...cabecalho, title: "Comunicados", tabBarIcon: icone("megaphone-outline") }} />
      <Tabs.Screen name="TabPerfil" component={PerfilScreen}
        options={{ ...cabecalho, title: "Perfil", tabBarIcon: icone("person-circle-outline") }} />
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
