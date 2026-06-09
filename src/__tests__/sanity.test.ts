import { describe, expect, it } from "vitest";

describe("vitest sanity", () => {
  it("executa testes basicos", () => {
    expect(1 + 1).toBe(2);
  });

  it("tem matchers do jest-dom carregados", () => {
    const div = document.createElement("div");
    div.textContent = "ola";
    expect(div).toHaveTextContent("ola");
  });
});
