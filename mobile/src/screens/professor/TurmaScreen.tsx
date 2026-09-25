import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Botao, Cartao, Tela, Texto, Titulo } from "../../components/ui";
import type { ProfessorStack } from "../../navigation/tipos";

type Props = NativeStackScreenProps<ProfessorStack, "Turma">;

export function TurmaScreen({ route, navigation }: Props) {
  const { turmaId, turmaNome } = route.params;
  return (
    <Tela>
      <Cartao>
        <Titulo>{turmaNome}</Titulo>
        <Texto suave>Escolha o que deseja registrar.</Texto>
      </Cartao>
      <Botao titulo="Fazer a chamada de hoje" onPress={() => navigation.navigate("Chamada", { turmaId, turmaNome })} />
      <Botao titulo="Avaliações e notas" variante="secundario" onPress={() => navigation.navigate("Notas", { turmaId, turmaNome })} />
    </Tela>
  );
}
