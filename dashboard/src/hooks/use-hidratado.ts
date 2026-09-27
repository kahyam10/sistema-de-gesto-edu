import { useSyncExternalStore } from "react";

const semAssinatura = () => () => {};

/**
 * false na renderização do servidor e na hidratação; true depois, no cliente.
 * Substitui o padrão `useEffect(() => setMounted(true), [])` sem setState em efeito.
 */
export function useHidratado(): boolean {
  return useSyncExternalStore(semAssinatura, () => true, () => false);
}
