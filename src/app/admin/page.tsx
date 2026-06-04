"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Participante = {
  id: number;
  nome_completo: string;
  apelido: string;
  email: string;
  telefone: string;
  pago: boolean;
  administrador: boolean;
};

export default function AdminPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarParticipantes() {
    const { data, error } = await supabase
      .from("participantes")
      .select("*")
      .order("id");

    if (!error && data) {
      setParticipantes(data);
    }

    setCarregando(false);
  }

  async function alternarPagamento(
    id: number,
    pagoAtual: boolean
  ) {
    const { error } = await supabase
      .from("participantes")
      .update({
        pago: !pagoAtual,
      })
      .eq("id", id);

    if (!error) {
      carregarParticipantes();
    }
  }

  useEffect(() => {
    carregarParticipantes();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto">

        <h1 className="text-4xl font-bold mb-6">
          🛠️ Painel Administrativo
        </h1>

        <div className="bg-white rounded-xl shadow p-6">

          <h2 className="text-2xl font-semibold mb-4">
            Participantes Cadastrados
          </h2>

          {carregando ? (
            <p>Carregando...</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">ID</th>
                  <th className="text-left p-2">Apelido</th>
                  <th className="text-left p-2">Nome</th>
                  <th className="text-left p-2">Pago</th>
                  <th className="text-left p-2">Admin</th>
                  <th className="text-left p-2">Ação</th>
                </tr>
              </thead>

              <tbody>
                {participantes.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b"
                  >
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.apelido}</td>
                    <td className="p-2">{p.nome_completo}</td>

                    <td className="p-2">
                      {p.pago ? "✅" : "❌"}
                    </td>

                    <td className="p-2">
                      {p.administrador ? "✅" : "❌"}
                    </td>

                    <td className="p-2">
                      <button
                        onClick={() =>
                          alternarPagamento(
                            p.id,
                            p.pago
                          )
                        }
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        {p.pago
                          ? "Cancelar"
                          : "Confirmar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        </div>
      </div>
    </main>
  );
}