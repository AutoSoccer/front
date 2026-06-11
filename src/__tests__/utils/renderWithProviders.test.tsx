import { describe, expect, it, beforeAll, beforeEach } from "vitest";

import "@/__tests__/mocks/api";
import "@/__tests__/mocks/router";
import {
  installLocalStorageMock,
  resetLocalStorageMock,
} from "@/__tests__/mocks/localStorage";
import {
  renderWithProviders,
  screen,
} from "@/__tests__/utils/renderWithProviders";

beforeAll(() => {
  installLocalStorageMock();
});

beforeEach(() => {
  resetLocalStorageMock();
});

describe("renderWithProviders", () => {
  it("renderiza o componente envolto por AntdProvider + AuthProvider", () => {
    renderWithProviders(<div data-testid="conteudo">ola providers</div>);

    expect(screen.getByTestId("conteudo")).toHaveTextContent("ola providers");
  });
});
