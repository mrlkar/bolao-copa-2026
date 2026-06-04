"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Participante = {
  id: number;
  nome_completo: string;
  apelido: string;
  pago: boolean;
  pontos: number;
  cravadas: number;
};

type Jogo = {
  id: number;
  fase: string;
  time_a: string;
  time_b: string;
  data_hora: string;
};

export default function PainelPage() {
  const router = useRouter();

  const [participante, setParticipante] = useState<Participante | null>(null);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [palpites, setPalpites] = useState<
    Record<number, { a: string; b: string }>
  >({});
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const dados = localStorage.getItem("participante");

    if (!dados) {
      router.push("/login");
      return;
    }

    const participanteLogado = JSON.parse(dados);
    setParticipante(participanteLogado);
    carregarJogos();
  }, [router]);

  async function carregarJogos() {
    const { data } = await supabase
      .from("jogos")
      .select("*")
      .order("data_hora");

    setJogos(data || []);
  }

  function alterarPalpite(jogoId: number, campo: "a" | "b", valor: string) {
    setPalpites((atual) => ({
      ...atual,
      [jogoId]: {
        ...atual[jogoId],
        [campo]: valor,
      },
    }));
  }

  async function salvarPalpite(jogoId: number) {
    setMensagem("");

    if (!participante) return;

    const palpite = palpites[jogoId];

    if (!palpite || palpite.a === "" || palpite.b === "") {
      setMensagem("Informe os dois placares antes de salvar.");
      return;
    }

    const { error } = await supabase.from("palpites").upsert(
      {
        participante_id: participante.id,
        jogo_id: jogoId,

        // Colunas antigas da sua tabela:
        gols_time_a: Number(palpite.a),
        gols_time_b: Number(palpite.b),

        // Colunas novas que também criamos:
        palpite_a: Number(palpite.a),
        palpite_b: Number(palpite.b),
      },
      {
        onConflict: "participante_id,jogo_id",
      }
    );

    if (error) {
      setMensagem("Erro ao salvar palpite: " + error.message);
      return;
    }

    setMensagem("Palpite salvo com sucesso!");
  }

  function sair() {
    localStorage.removeItem("participante");
    router.push("/login");
  }

  if (!participante) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <p>Carregando...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <section className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            🏆 Bolão da Copa 2026
          </h1>

          <p className="text-center text-gray-600 mb-6">
            Área do Participante
          </p>

          <p>
            <strong>Olá,</strong>{" "}
            {participante.apelido || participante.nome_completo}!
          </p>

          <p>
            <strong>Status do pagamento:</strong>{" "}
            {participante.pago ? "✅ Confirmado" : "⏳ Aguardando confirmação"}
          </p>

          <p>
            <strong>Pontos:</strong> {participante.pontos ?? 0}
          </p>

          <p>
            <strong>Cravadas:</strong> {participante.cravadas ?? 0}
          </p>

          <button
            onClick={sair}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
          >
            Sair
          </button>
        </section>

        <section className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Meus Palpites</h2>

          {jogos.length === 0 ? (
            <p>Nenhum jogo cadastrado.</p>
          ) : (
            <div className="space-y-4">
              {jogos.map((jogo) => (
                <div key={jogo.id} className="border rounded-lg p-4">
                  <p className="font-semibold">
                    {jogo.time_a} x {jogo.time_b}
                  </p>

                  <p className="text-sm text-gray-600 mb-3">
                    {jogo.fase} —{" "}
                    {new Date(jogo.data_hora).toLocaleString("pt-BR")}
                  </p>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      className="w-20 border rounded p-2 text-center"
                      placeholder="0"
                      value={palpites[jogo.id]?.a || ""}
                      onChange={(e) =>
                        alterarPalpite(jogo.id, "a", e.target.value)
                      }
                    />

                    <span>x</span>

                    <input
                      type="number"
                      min="0"
                      className="w-20 border rounded p-2 text-center"
                      placeholder="0"
                      value={palpites[jogo.id]?.b || ""}
                      onChange={(e) =>
                        alterarPalpite(jogo.id, "b", e.target.value)
                      }
                    />

                    <button
                      onClick={() => salvarPalpite(jogo.id)}
                      className="ml-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
        </section>
      </div>
    </main>
  );
}