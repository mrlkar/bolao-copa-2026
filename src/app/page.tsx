"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Participante = {
  id: number;
  nome_completo: string;
  apelido: string;
  pago: boolean;
  pontos: number;
  cravadas: number;
};

export default function Home() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);

  useEffect(() => {
    carregarParticipantes();
  }, []);

  async function carregarParticipantes() {
    const { data } = await supabase
      .from("participantes")
      .select("*")
      .order("pontos", { ascending: false });

    setParticipantes(data || []);
  }

  const pagos = participantes.filter((p) => p.pago);
  const ranking = [...pagos].sort((a, b) => {
    if ((b.pontos || 0) !== (a.pontos || 0)) {
      return (b.pontos || 0) - (a.pontos || 0);
    }

    if ((b.cravadas || 0) !== (a.cravadas || 0)) {
      return (b.cravadas || 0) - (a.cravadas || 0);
    }

    return a.id - b.id;
  });

  function medalha(posicao: number) {
    if (posicao === 0) return "🥇";
    if (posicao === 1) return "🥈";
    if (posicao === 2) return "🥉";
    return `${posicao + 1}º`;
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">
            🏆 Bolão da Copa 2026
          </h1>

          <p className="text-gray-600 mb-6">
            Palpites, ranking e emoção até a final.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-50 rounded p-4">
              <p className="text-sm text-gray-500">Participantes pagos</p>
              <p className="text-2xl font-bold">{pagos.length} / 50</p>
            </div>

            <div className="bg-slate-50 rounded p-4">
              <p className="text-sm text-gray-500">Vagas restantes</p>
              <p className="text-2xl font-bold">{50 - pagos.length}</p>
            </div>

            <div className="bg-slate-50 rounded p-4">
              <p className="text-sm text-gray-500">Arrecadação</p>
              <p className="text-2xl font-bold">
                R$ {(pagos.length * 50).toLocaleString("pt-BR")},00
              </p>
            </div>
          </div>

          <div className="flex justify-center gap-3">
            <Link
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
            >
              Entrar
            </Link>

            <Link
              href="/cadastro"
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded font-semibold"
            >
              Criar Conta
            </Link>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">
            🏆 Ranking Geral
          </h2>

          {ranking.length === 0 ? (
            <p>Nenhum participante confirmado ainda.</p>
          ) : (
            <div className="space-y-3">
              {ranking.map((p, index) => (
                <div
                  key={p.id}
                  className="flex justify-between border-b pb-2"
                >
                  <span>
                    <strong>{medalha(index)}</strong>{" "}
                    {p.apelido || p.nome_completo}
                  </span>

                  <span>
                    {p.pontos || 0} pts · {p.cravadas || 0} cravadas
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}