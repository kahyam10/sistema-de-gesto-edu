import { useAuth } from "../auth/AuthContext";
import { Botao, Cartao, Rotulo, Tela, Texto, Titulo } from "../components/ui";
import { rotuloPapel } from "../utils/formato";

export function PerfilScreen() {
  const { usuario, sair } = useAuth();
  return (
    <Tela>
      <Cartao>
        <Titulo>{usuario?.nome}</Titulo>
        <Texto suave>{usuario?.email}</Texto>
        <Rotulo>{rotuloPapel[usuario?.role ?? ""] ?? usuario?.role}</Rotulo>
      </Cartao>
      <Botao titulo="Sair" variante="perigo" onPress={() => void sair()} />
    </Tela>
  );
}
