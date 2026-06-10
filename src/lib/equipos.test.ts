import { describe, it, expect } from "vitest";
import { isoDeEquipo, flagUrl } from "./equipos";

describe("equipos", () => {
  it("devuelve ISO de equipos conocidos", () => {
    expect(isoDeEquipo("Argentina")).toBe("ar");
    expect(isoDeEquipo("Brasil")).toBe("br");
    expect(isoDeEquipo("Inglaterra")).toBe("gb-eng");
    expect(isoDeEquipo("Escocia")).toBe("gb-sct");
  });
  it("devuelve null para desconocidos", () => {
    expect(isoDeEquipo("Atlántida")).toBeNull();
  });
  it("construye la URL de bandera flagcdn", () => {
    expect(flagUrl("Argentina")).toBe("https://flagcdn.com/ar.svg");
  });
  it("URL null si no hay ISO", () => {
    expect(flagUrl("Atlántida")).toBeNull();
  });
});
