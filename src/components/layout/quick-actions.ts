export type QuickAction = {
  href: string;
  title: string;
  hint: string;
  icon: "market" | "online" | "expense" | "fuel";
  tone: "green" | "sky" | "amber" | "rose";
};

/** The entries people make most often, one tap away. */
export const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/incasari?nou=targ",
    title: "Încasare târg",
    hint: "Totalul zilei, într-un pas",
    icon: "market",
    tone: "green",
  },
  {
    href: "/incasari?nou=online",
    title: "Vânzare online",
    hint: "OLX, Vinted, Facebook",
    icon: "online",
    tone: "sky",
  },
  {
    href: "/cheltuieli?nou=1",
    title: "Cheltuială",
    hint: "Marfă, taxe, amenzi…",
    icon: "expense",
    tone: "rose",
  },
  {
    href: "/cheltuieli?nou=combustibil",
    title: "Motorină",
    hint: "Drum de import sau târg",
    icon: "fuel",
    tone: "amber",
  },
];
