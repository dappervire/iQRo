"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";
import { bacaTema, langgananTema, pasangTema } from "@/lib/tema";
import type { PilihanTema } from "@/lib/types";

const PILIHAN: { tema: PilihanTema; label: string; Ikon: LucideIcon }[] = [
  { tema: "sistem", label: "Ikuti perangkat", Ikon: Monitor },
  { tema: "terang", label: "Terang", Ikon: Sun },
  { tema: "gelap", label: "Gelap", Ikon: Moon },
];

export default function PilihTema() {
  // Di server belum ada <html> untuk dibaca, jadi anggap "sistem" dulu.
  const aktif = useSyncExternalStore(langgananTema, bacaTema, () => "sistem" as const);

  return (
    <div role="group" aria-label="Tema tampilan" className="flex rounded-md bg-permukaan p-0.5">
      {PILIHAN.map(({ tema, label, Ikon }) => (
        <button
          key={tema}
          type="button"
          onClick={() => pasangTema(tema)}
          aria-pressed={aktif === tema}
          aria-label={label}
          title={label}
          className={`flex size-9 items-center justify-center rounded ${
            aktif === tema ? "bg-teks text-latar" : "text-teks-redup hover:text-teks"
          }`}
        >
          <Ikon aria-hidden="true" className="size-4" />
        </button>
      ))}
    </div>
  );
}
