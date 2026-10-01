import { describe, expect, it } from "vitest";
import {
  apiDateToInput,
  dataPostagemHoje,
  formatarData,
  inputDateToApi,
  isoParaInputDataHora,
  parseDataFlexivel,
  validarDatasProjeto,
} from "../app/lib/date";

describe("conversão de datas (contrato dd/MM/yyyy do backend)", () => {
  it("converte input date -> API e volta", () => {
    expect(inputDateToApi("2026-09-21")).toBe("21/09/2026");
    expect(apiDateToInput("21/09/2026")).toBe("2026-09-21");
    expect(inputDateToApi("")).toBe("");
    expect(apiDateToInput(null)).toBe("");
    expect(apiDateToInput("lixo")).toBe("");
  });

  it("interpreta ISO (LocalDateTime) e dd/MM/yyyy", () => {
    expect(parseDataFlexivel("21/09/2026")?.getDate()).toBe(21);
    expect(parseDataFlexivel("2026-09-21T10:30:00")?.getHours()).toBe(10);
    expect(parseDataFlexivel("não é data")).toBeNull();
    expect(formatarData(undefined)).toBe("—");
  });

  it("corta ISO para datetime-local", () => {
    expect(isoParaInputDataHora("2026-09-21T10:30:15.123")).toBe("2026-09-21T10:30");
  });

  it("dataPostagemHoje usa a maior data entre local e UTC (@FutureOrPresent no servidor)", () => {
    // 21/09 23:30 em UTC-3 = 22/09 02:30 UTC
    const agora = new Date("2026-09-22T02:30:00Z");
    const resultado = dataPostagemHoje(agora);
    expect(resultado).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    const [dia] = resultado.split("/").map(Number);
    expect(dia).toBe(22);
  });

  it("valida datas de projeto como o ProjetoRequestDTO", () => {
    const hoje = "2026-09-21";
    expect(validarDatasProjeto("", "", hoje)).toMatch(/Informe/);
    expect(validarDatasProjeto("2026-09-20", "2026-12-01", hoje)).toMatch(/anterior a hoje/);
    expect(validarDatasProjeto("2026-09-21", "2026-09-21", hoje)).toMatch(/futura/);
    expect(validarDatasProjeto("2026-10-10", "2026-10-01", hoje)).toMatch(/anterior à data de início/);
    expect(validarDatasProjeto("2026-09-21", "2026-12-01", hoje)).toBeNull();
  });
});
