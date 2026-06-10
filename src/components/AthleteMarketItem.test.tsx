import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";

import "@/__tests__/mocks/router";

import AthleteMarketItemCard from "@/components/AthleteMarketItem";
import type { AthleteMarketItem } from "@/app/game/athletes";
import { renderWithProviders as render } from "@/__tests__/utils/renderWithProviders";

function buildAthlete(overrides: Partial<AthleteMarketItem> = {}): AthleteMarketItem {
  return {
    id: "10",
    athleteId: 10,
    name: "Ronaldinho",
    icon: "/athlete.svg",
    stats: { atk: 99, vel: 87, def: 55, hab: "Drible elastico" },
    cost: 7,
    tier: "ouro",
    type: "attacker",
    ...overrides,
  };
}

describe("AthleteMarketItemCard", () => {
  it("renderiza slot vazio quando item eh null", () => {
    const onDragStart = vi.fn();
    render(<AthleteMarketItemCard item={null} index={2} onDragStart={onDragStart} />);

    expect(screen.getByText(/Vaga dispon.+vel 3/i)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renderiza atleta com nome, custo e atributos", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete();
    render(<AthleteMarketItemCard item={athlete} index={0} onDragStart={onDragStart} />);

    expect(screen.getByText("Ronaldinho")).toBeInTheDocument();
    expect(screen.getByText("7 moedas")).toBeInTheDocument();
    expect(screen.getByText("ATK")).toBeInTheDocument();
    expect(screen.getByText("99")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText("55")).toBeInTheDocument();
    expect(screen.getByText("Drible")).toBeInTheDocument();
  });

  it("dispara onDragStart com id do atleta ao iniciar drag", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete({ id: "42" });
    render(<AthleteMarketItemCard item={athlete} index={1} onDragStart={onDragStart} />);

    const button = screen.getByRole("button", {
      name: /Arrastar Ronaldinho para o campo/i,
    });

    fireEvent.dragStart(button);

    expect(onDragStart).toHaveBeenCalledTimes(1);
    expect(onDragStart.mock.calls[0][1]).toBe("42");
  });

  it("expoe aria-label descritivo no botao", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete({ name: "Pele" });
    render(<AthleteMarketItemCard item={athlete} index={0} onDragStart={onDragStart} />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Arrastar Pele para o campo");
    expect(button).toHaveAttribute("draggable");
  });

  it("formata custo com sufixo moedas", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete({ cost: 12 });
    render(<AthleteMarketItemCard item={athlete} index={0} onDragStart={onDragStart} />);

    expect(screen.getByText("12 moedas")).toBeInTheDocument();
  });

  it("renderiza icone como imagem quando comeca com barra", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete({ icon: "/athlete.svg" });
    const { container } = render(
      <AthleteMarketItemCard item={athlete} index={0} onDragStart={onDragStart} />
    );

    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/athlete.svg");
  });

  it("renderiza icone como texto quando nao comeca com barra", () => {
    const onDragStart = vi.fn();
    const athlete = buildAthlete({ icon: "X" });
    render(<AthleteMarketItemCard item={athlete} index={0} onDragStart={onDragStart} />);

    expect(screen.getByText("X")).toBeInTheDocument();
  });
});
