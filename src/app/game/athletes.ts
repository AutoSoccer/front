export type AthleteStats = {
  atk: number;
  vel: number;
  def: number;
  hab: string;
}

export type AthleteMarketItem = {
  id: string;
  name: string;
  icon: string;
  stats: AthleteStats;
};

export const athletePool: Array<AthleteMarketItem | null> = [
  { 
    id: "athlete-1", 
    name: "Neymar Jr.", 
    icon: "/athlete.svg", 
    stats: {
        atk: 20,
        vel: 90,
        def: 30,
        hab: "Drible"
    }     
  },
  {
    id: "athlete-2",
    name: "Vinicius Jr.",
    icon: "/athlete.svg",
    stats: {
      atk: 88,
      vel: 96,
      def: 40,
      hab: "Explosão"
    }
  },
  {
    id: "athlete-3",
    name: "Casemiro",
    icon: "/athlete.svg",
    stats: {
      atk: 72,
      vel: 55,
      def: 92,
      hab: "Desarme"
    }
  },
  {
    id: "athlete-4",
    name: "Alisson",
    icon: "/athlete.svg",
    stats: {
      atk: 20,
      vel: 58,
      def: 95,
      hab: "Defesa de Reflexo"
    }
  },
  {
    id: "athlete-5",
    name: "Marta",
    icon: "/athlete.svg",
    stats: {
      atk: 84,
      vel: 86,
      def: 52,
      hab: "Finalização"
    }
  },
  {
    id: "athlete-6",
    name: "Raphinha",
    icon: "/athlete.svg",
    stats: {
      atk: 81,
      vel: 92,
      def: 44,
      hab: "Cruzamento"
    }
  },
  {
    id: "athlete-7",
    name: "Thiago Silva",
    icon: "/athlete.svg",
    stats: {
      atk: 35,
      vel: 48,
      def: 94,
      hab: "Posicionamento"
    }
  },
  {
    id: "athlete-8",
    name: "Endrick",
    icon: "/athlete.svg",
    stats: {
      atk: 79,
      vel: 87,
      def: 38,
      hab: "Arranque"
    }
  },
];