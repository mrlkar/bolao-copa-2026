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
  gols_a: number | null;
  gols_b: number | null;
  encerrado: boolean;
  teve_penaltis: boolean | null;
  penaltis_a: number | null;
  penaltis_b: number | null;
};

type PalpitePublico = {
  participante_id: number;
  jogo_id: number;
  gols_time_a: number;
  gols_time_b: number;
  palpite_penaltis_a: number | null;
  palpite_penaltis_b: number | null;
};

type Pontuacao = {
  participante_id: number;
  jogo_id: number;
  pontos: number;
  cravada: boolean;
};

export default function PainelPage() {
  const router = useRouter();

  const [participante, setParticipante] = useState<Participante | null>(null);
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [palpites, setPalpites] = useState<
    Record<number, { a: string; b: string; penA: string; penB: string }>
  >({});
  const [palpitesPublicos, setPalpitesPublicos] = useState<PalpitePublico[]>([]);
  const [pontuacoes, setPontuacoes] = useState<Pontuacao[]>([]);
  const ranking = [...participantes].sort((a, b) => {
  if ((b.pontos || 0) !== (a.pontos || 0)) {
    return (b.pontos || 0) - (a.pontos || 0);
  }

  if ((b.cravadas || 0) !== (a.cravadas || 0)) {
    return (b.cravadas || 0) - (a.cravadas || 0);
  }

  return a.id - b.id;
});
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    const dados = localStorage.getItem("participante");

    if (!dados) {
      router.push("/login");
      return;
    }

    const participanteLogado = JSON.parse(dados);
    setParticipante(participanteLogado);
    carregarDados(participanteLogado.id);
  }, [router]);

  async function carregarDados(participanteId: number) {
    const { data: dadosJogos } = await supabase
      .from("jogos")
      .select("*")
      .order("data_hora");

    const { data: todosParticipantes } = await supabase
      .from("participantes")
      .select("*");

    const { data: todosPalpites } = await supabase.from("palpites").select("*");

    const { data: todasPontuacoes } = await supabase
      .from("pontuacoes")
      .select("*");

    setJogos(dadosJogos || []);
    setParticipantes(todosParticipantes || []);
    setPalpitesPublicos(todosPalpites || []);
    setPontuacoes(todasPontuacoes || []);

    const meusPalpites: Record<
      number,
      { a: string; b: string; penA: string; penB: string }
    > = {};

    (todosPalpites || [])
      .filter((p) => p.participante_id === participanteId)
      .forEach((p) => {
        meusPalpites[p.jogo_id] = {
          a: String(p.gols_time_a),
          b: String(p.gols_time_b),
          penA:
            p.palpite_penaltis_a === null || p.palpite_penaltis_a === undefined
              ? ""
              : String(p.palpite_penaltis_a),
          penB:
            p.palpite_penaltis_b === null || p.palpite_penaltis_b === undefined
              ? ""
              : String(p.palpite_penaltis_b),
        };
      });

    setPalpites(meusPalpites);
  }

  function faseEliminatoria(fase: string) {
    return fase !== "Fase de Grupos";
  }

  function jogoFechado(dataHora: string) {
    const horarioJogo = new Date(dataHora).getTime();
    const fechamento = horarioJogo - 60 * 1000;
    return Date.now() >= fechamento;
  }

  function alterarPalpite(
    jogoId: number,
    campo: "a" | "b" | "penA" | "penB",
    valor: string
  ) {
    setPalpites((atual) => ({
      ...atual,
      [jogoId]: {
        a: atual[jogoId]?.a || "",
        b: atual[jogoId]?.b || "",
        penA: atual[jogoId]?.penA || "",
        penB: atual[jogoId]?.penB || "",
        [campo]: valor,
      },
    }));
  }

  async function salvarPalpite(jogo: Jogo) {
    setMensagem("");

    if (!participante) return;

    if (jogoFechado(jogo.data_hora)) {
      setMensagem("Palpites encerrados para este jogo.");
      return;
    }

    const palpite = palpites[jogo.id];

    if (!palpite || palpite.a === "" || palpite.b === "") {
      setMensagem("Informe os dois placares antes de salvar.");
      return;
    }

    const precisaPenaltis = faseEliminatoria(jogo.fase);

    if (precisaPenaltis && (palpite.penA === "" || palpite.penB === "")) {
      setMensagem("Informe também o palpite dos pênaltis.");
      return;
    }

    const { error } = await supabase.from("palpites").upsert(
      {
        participante_id: participante.id,
        jogo_id: jogo.id,
        gols_time_a: Number(palpite.a),
        gols_time_b: Number(palpite.b),
        palpite_a: Number(palpite.a),
        palpite_b: Number(palpite.b),
        palpite_penaltis_a: precisaPenaltis ? Number(palpite.penA) : null,
        palpite_penaltis_b: precisaPenaltis ? Number(palpite.penB) : null,
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
    carregarDados(participante.id);
  }

  function nomeParticipante(id: number) {
    const p = participantes.find((item) => item.id === id);
    return p?.apelido || p?.nome_completo || "Participante";
  }

  function palpitesDoJogo(jogoId: number) {
    return palpitesPublicos.filter((p) => p.jogo_id === jogoId);
  }

  function pontuacaoDoJogo(jogoId: number) {
    if (!participante) return null;

    return (
      pontuacoes.find(
        (p) => p.jogo_id === jogoId && p.participante_id === participante.id
      ) || null
    );
  }

  function sair() {
    localStorage.removeItem("participante");
    router.push("/login");
  }
const minhaPosicao =
  ranking.findIndex((p) => p.id === participante?.id) + 1;
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
<p>
  <strong>Posição Atual:</strong> 🏆 {minhaPosicao}º lugar
</p>
<div className="mt-6 bg-yellow-50 border border-yellow-300 rounded p-4">
  <h2 className="font-bold text-lg mb-2">
    🏆 Ranking Geral
  </h2>

  <div className="space-y-1">
    {ranking.slice(0, 10).map((p, index) => (
      <div
        key={p.id}
        className={
          p.id === participante.id
            ? "font-bold text-blue-700"
            : ""
        }
      >
        {index + 1}º - {p.apelido || p.nome_completo}
        {" — "}
        {p.pontos || 0} pts
        {" — "}
        {p.cravadas || 0} cravadas
      </div>
    ))}
  </div>
</div>
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
              {jogos.map((jogo) => {
                const fechado = jogoFechado(jogo.data_hora);
                const listaPalpites = palpitesDoJogo(jogo.id);
                const ehEliminatorio = faseEliminatoria(jogo.fase);
                const pontosDoJogo = pontuacaoDoJogo(jogo.id);

                return (
                  <div key={jogo.id} className="border rounded-lg p-4">
                    <p className="font-semibold">
                      {jogo.time_a} x {jogo.time_b}
                    </p>

                    <p className="text-sm text-gray-600 mb-1">
                      {jogo.fase} —{" "}
                      {new Date(jogo.data_hora).toLocaleString("pt-BR")}
                    </p>

                    <p className="text-sm mb-3">
                      {fechado
                        ? "🔒 Palpites encerrados"
                        : "🟢 Palpites abertos até 1 minuto antes do jogo"}
                    </p>

                    {jogo.encerrado && (
                      <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded p-3">
                        <p className="font-medium">
                          Resultado: {jogo.gols_a} x {jogo.gols_b}
                          {jogo.teve_penaltis
                            ? ` — Pênaltis: ${jogo.penaltis_a} x ${jogo.penaltis_b}`
                            : ""}
                        </p>

                        <p className="mt-1 font-semibold">
                          Pontos neste jogo: {pontosDoJogo?.pontos ?? 0}
                          {pontosDoJogo?.cravada ? " 🎯 Cravada!" : ""}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="number"
                        min="0"
                        disabled={fechado}
                        className="w-20 border rounded p-2 text-center disabled:bg-gray-200"
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
                        disabled={fechado}
                        className="w-20 border rounded p-2 text-center disabled:bg-gray-200"
                        placeholder="0"
                        value={palpites[jogo.id]?.b || ""}
                        onChange={(e) =>
                          alterarPalpite(jogo.id, "b", e.target.value)
                        }
                      />

                      <button
                        onClick={() => salvarPalpite(jogo)}
                        disabled={fechado}
                        className="ml-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
                      >
                        Salvar
                      </button>
                    </div>

                    {ehEliminatorio && !fechado && (
                      <div className="mt-4 bg-slate-50 rounded p-4">
                        <p className="font-medium mb-2">
                          Informe também seu palpite para eventual decisão por
                          pênaltis:
                        </p>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            className="w-20 border rounded p-2 text-center"
                            placeholder="0"
                            value={palpites[jogo.id]?.penA || ""}
                            onChange={(e) =>
                              alterarPalpite(jogo.id, "penA", e.target.value)
                            }
                          />

                          <span>x</span>

                          <input
                            type="number"
                            min="0"
                            className="w-20 border rounded p-2 text-center"
                            placeholder="0"
                            value={palpites[jogo.id]?.penB || ""}
                            onChange={(e) =>
                              alterarPalpite(jogo.id, "penB", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    )}

                    {fechado && (
                      <div className="mt-5 bg-slate-50 rounded p-4">
                        <h3 className="font-semibold mb-2">
                          Palpites dos participantes
                        </h3>

                        {listaPalpites.length === 0 ? (
                          <p>Nenhum palpite registrado.</p>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Participante</th>
                                <th className="text-left py-2">Palpite</th>
                              </tr>
                            </thead>

                            <tbody>
                              {listaPalpites.map((p) => (
                                <tr
                                  key={`${p.participante_id}-${p.jogo_id}`}
                                  className="border-b"
                                >
                                  <td className="py-2">
                                    {nomeParticipante(p.participante_id)}
                                  </td>

                                  <td className="py-2">
                                    {p.gols_time_a} x {p.gols_time_b}
                                    {p.palpite_penaltis_a !== null &&
                                    p.palpite_penaltis_b !== null
                                      ? ` — Pênaltis: ${p.palpite_penaltis_a} x ${p.palpite_penaltis_b}`
                                      : ""}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
        </section>
      </div>
    </main>
  );
}