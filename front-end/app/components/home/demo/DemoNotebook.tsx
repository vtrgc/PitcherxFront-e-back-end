import DemoPerfil from "./DemoPerfil";
import DemoProjeto from "./DemoProjeto";
import DemoSidebar from "./DemoSidebar";

/**
 * Tela do notebook do interessado (1280 × 772 virtuais): Sidebar real + páginas
 * /projetos/[id] (visitante) e /perfil/[id]. Usada na foto 03 e no notebook em HTML,
 * com o mesmo estado inicial para a troca foto → HTML ser imperceptível.
 */
export function TelaNotebook({ prefixo }: { prefixo: string }) {
  return (
    <div className="flex h-full w-full bg-[#F7F4FD]">
      <DemoSidebar ativo="explorar" />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div data-hx={`${prefixo}-pag-projeto`} className="hx-pagina-lap absolute inset-0 overflow-hidden">
          <div data-hx={`${prefixo}-pag-projeto-rolagem`} className="px-10 py-8">
            <div className="max-w-[860px]">
              <DemoProjeto visao="visitante" prefixo={prefixo} />
            </div>
          </div>
        </div>
        <div data-hx={`${prefixo}-pag-perfil`} className="hx-pagina-lap absolute inset-0 overflow-hidden bg-[#F7F4FD]">
          <div className="px-10 py-8">
            <div className="max-w-[760px]">
              <DemoPerfil semente={11} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
