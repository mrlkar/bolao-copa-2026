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

export default function RankingPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<number | null>(null);

  useEffect(() => {
    carregarRanking();

    const dados = localStorage.getItem("participante");
    if (dados) {
      const participante = JSON.parse(dados);
      setUsuarioLogadoId(participante.id);
    }
  }, []);

  async function carregarRanking() {
    const { data } = await supabase.from("participantes").select("*");

    const pagos = (data || []).filter((p) => p.pago);

    const ordenados = pagos.sort((a, b) => {
      if ((b.pontos || 0) !== (a.pontos || 0)) {
        return (b.pontos || 0) - (a.pontos || 0);
      }

      if ((b.cravadas || 0) !== (a.cravadas || 0)) {
        return (b.cravadas || 0) - (a.cravadas || 0);
      }

      return a.id - b.id;
    });

    setParticipantes(ordenados);
  }

  function posicao(index: number) {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `${index + 1}º`;
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-2">
          🏆 Ranking Geral
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Classificação atual do Bolão da Copa 2026
        </p>

        {participantes.length === 0 ? (
          <p className="text-center">Nenhum participante confirmado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="text-left p-3">Posição</th>
                  <th className="text-left p-3">Participante</th>
                  <th className="text-left p-3">Pontos</th>
                  <th className="text-left p-3">Cravadas</th>
                </tr>
              </thead>

              <tbody>
                {participantes.map((p, index) => (
                  <tr
                    key={p.id}
                    className={
                      p.id === usuarioLogadoId
                        ? "border-b bg-yellow-100 font-bold"
                        : "border-b"
                    }
                  >
                    <td className="p-3">{posicao(index)}</td>
                    <td className="p-3">{p.apelido || p.nome_completo}</td>
                    <td className="p-3">{p.pontos || 0}</td>
                    <td className="p-3">{p.cravadas || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="bg-slate-600 hover:bg-slate-700 text-white px-5 py-2 rounded font-semibold"
          >
            Página Inicial
          </Link>

          <Link
            href="/painel"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold"
          >
            Meu Painel
          </Link>
        </div>
      </div>
    </main>
  );
}