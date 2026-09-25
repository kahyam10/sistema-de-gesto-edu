import { useAuth } from "../auth/AuthContext";
import { Botao, Cartao, Tela, Texto, Titulo } from "../components/ui";

// Direção, secretaria e SEMEC usam o painel web; o app é para professores e famílias
export function SemAcessoScreen() {
  const { usuario, sair } = useAuth();
  return (
    <Tela>
      <Cartao>
        <Titulo>Olá, {usuario?.nome?.split(" ")[0]}</Titulo>
        <Texto>
          O aplicativo é voltado a professores e responsáveis. Para as funções de gestão, use o painel web
          do sistema.
        </Texto>
      </Cartao>
      <Botao titulo="Sair" variante="secundario" onPress={() => void sair()} />
    </Tela>
  );
}
