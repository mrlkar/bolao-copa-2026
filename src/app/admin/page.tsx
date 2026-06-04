"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Participante = {
  id: number;
  nome_completo: string;
  apelido: string;
  pago: boolean;
  administrador: boolean;
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
};

type Palpite = {
  participante_id: number;
  jogo_id: number;
  gols_time_a: number;
  gols_time_b: number;
};

export default function AdminPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [fase, setFase] = useState("Fase de Grupos");
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [resultados, setResultados] = useState<Record<number, { a: string; b: string }>>({});
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
    const { data: dadosParticipantes } = await supabase.from("participantes").select("*").order("id");
    const { data: dadosJogos } = await supabase.from("jogos").select("*").order("data_hora");

    setParticipantes(dadosParticipantes || []);
    setJogos(dadosJogos || []);
  }

  async function alternarPagamento(id: number, pagoAtual: boolean) {
    await supabase.from("participantes").update({ pago: !pagoAtual }).eq("id", id);
    carregarDados();
  }

  async function cadastrarJogo() {
    setMensagem("");

    if (!fase || !timeA.trim() || !timeB.trim() || !dataHora) {
      setMensagem("Preencha todos os dados do jogo.");
      return;
    }

    const { error } = await supabase.from("jogos").insert([
      {
        fase,
        time_a: timeA,
        time_b: timeB,
        data_hora: dataHora,
        encerrado: false,
      },
    ]);

    if (error) {
      setMensagem("Erro ao cadastrar jogo: " + error.message);
      return;
    }

    setMensagem("Jogo cadastrado com sucesso!");
    setTimeA("");
    setTimeB("");
    setDataHora("");
    carregarDados();
  }

  function regraPontuacao(fase: string) {
    if (fase === "Fase de Grupos") return { cravada: 4, vencedorGol: 3, vencedor: 2, empateErradoGol: 1 };
    if (fase === "2ª Fase") return { cravada: 5, vencedorGol: 4, vencedor: 2, empateErradoGol: 1 };
    if (fase === "Oitavas de Final") return { cravada: 6, vencedorGol: 4, vencedor: 3, empateErradoGol: 1 };
    if (fase === "Quartas de Final") return { cravada: 7, vencedorGol: 5, vencedor: 3, empateErradoGol: 2 };
    if (fase === "Semifinais") return { cravada: 8, vencedorGol: 6, vencedor: 4, empateErradoGol: 2 };
    if (fase === "Disputa de 3º Lugar") return { cravada: 8, vencedorGol: 6, vencedor: 4, empateErradoGol: 2 };
    if (fase === "Final") return { cravada: 10, vencedorGol: 7, vencedor: 5, empateErradoGol: 3 };
    return { cravada: 4, vencedorGol: 3, vencedor: 2, empateErradoGol: 1 };
  }

  function resultadoTipo(a: number, b: number) {
    if (a > b) return "A";
    if (b > a) return "B";
    return "E";
  }

  function calcularPontuacao(jogo: Jogo, palpite: Palpite, golsA: number, golsB: number) {
    const regra = regraPontuacao(jogo.fase);

    const pa = palpite.gols_time_a;
    const pb = palpite.gols_time_b;

    const tipoReal = resultadoTipo(golsA, golsB);
    const tipoPalpite = resultadoTipo(pa, pb);

    if (pa === golsA && pb === golsB) {
      return { pontos: regra.cravada, cravada: true };
    }

    if (tipoReal === tipoPalpite) {
      if (pa === golsA || pb === golsB) {
        return { pontos: regra.vencedorGol, cravada: false };
      }

      return { pontos: regra.vencedor, cravada: false };
    }

    if (tipoReal !== "E" && tipoPalpite === "E" && (pa === golsA || pb === golsB)) {
      return { pontos: regra.empateErradoGol, cravada: false };
    }

    return { pontos: 0, cravada: false };
  }

  async function salvarResultado(jogo: Jogo) {
    setMensagem("");

    const resultado = resultados[jogo.id];

    if (!resultado || resultado.a === "" || resultado.b === "") {
      setMensagem("Informe os dois placares do resultado.");
      return;
    }

    const golsA = Number(resultado.a);
    const golsB = Number(resultado.b);

    await supabase
      .from("jogos")
      .update({
        gols_a: golsA,
        gols_b: golsB,
        encerrado: true,
      })
      .eq("id", jogo.id);

    const { data: palpitesDoJogo } = await supabase
      .from("palpites")
      .select("*")
      .eq("jogo_id", jogo.id);

    for (const palpite of (palpitesDoJogo || []) as Palpite[]) {
      const calculo = calcularPontuacao(jogo, palpite, golsA, golsB);

      await supabase.from("pontuacoes").upsert(
        {
          participante_id: palpite.participante_id,
          jogo_id: jogo.id,
          pontos: calculo.pontos,
          cravada: calculo.cravada,
        },
        {
          onConflict: "participante_id,jogo_id",
        }
      );
    }

    const { data: todasPontuacoes } = await supabase.from("pontuacoes").select("*");

    for (const participante of participantes) {
      const pontosParticipante = (todasPontuacoes || []).filter(
        (p) => p.participante_id === participante.id
      );

      const totalPontos = pontosParticipante.reduce((soma, p) => soma + (p.pontos || 0), 0);
      const totalCravadas = pontosParticipante.filter((p) => p.cravada).length;

      await supabase
        .from("participantes")
        .update({
          pontos: totalPontos,
          cravadas: totalCravadas,
        })
        .eq("id", participante.id);
    }

    setMensagem("Resultado salvo e pontuação recalculada!");
    carregarDados();
  }

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">🛠️ Painel Administrativo</h1>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Participantes</h2>

          <table className="w-full border-collapse">
            <tbody>
              {participantes.map((p) => (
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.apelido}</td>
                  <td className="p-2">{p.nome_completo}</td>
                  <td className="p-2">{p.pago ? "✅ Pago" : "❌ Pendente"}</td>
                  <td className="p-2">{p.administrador ? "✅ Admin" : "Participante"}</td>
                  <td className="p-2">
                    <button
                      onClick={() => alternarPagamento(p.id, p.pago)}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      {p.pago ? "Cancelar" : "Confirmar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Cadastrar Jogo</h2>

          <select value={fase} onChange={(e) => setFase(e.target.value)} className="w-full border rounded p-3 mb-3">
            <option>Fase de Grupos</option>
            <option>2ª Fase</option>
            <option>Oitavas de Final</option>
            <option>Quartas de Final</option>
            <option>Semifinais</option>
            <option>Disputa de 3º Lugar</option>
            <option>Final</option>
          </select>

          <input placeholder="Seleção A" value={timeA} onChange={(e) => setTimeA(e.target.value)} className="w-full border rounded p-3 mb-3" />
          <input placeholder="Seleção B" value={timeB} onChange={(e) => setTimeB(e.target.value)} className="w-full border rounded p-3 mb-3" />
          <input type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} className="w-full border rounded p-3 mb-4" />

          <button onClick={cadastrarJogo} className="bg-green-600 text-white font-semibold px-4 py-2 rounded">
            Cadastrar Jogo
          </button>

          {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Resultados dos Jogos</h2>

          {jogos.map((jogo) => (
            <div key={jogo.id} className="border rounded-lg p-4 mb-4">
              <p className="font-semibold">
                {jogo.time_a} x {jogo.time_b}
              </p>

              <p className="text-sm text-gray-600 mb-3">
                {jogo.fase} — {new Date(jogo.data_hora).toLocaleString("pt-BR")}
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  className="w-20 border rounded p-2 text-center"
                  placeholder="0"
                  value={resultados[jogo.id]?.a ?? jogo.gols_a ?? ""}
                  onChange={(e) =>
                    setResultados((atual) => ({
                      ...atual,
                      [jogo.id]: {
                        ...atual[jogo.id],
                        a: e.target.value,
                      },
                    }))
                  }
                />

                <span>x</span>

                <input
                  type="number"
                  min="0"
                  className="w-20 border rounded p-2 text-center"
                  placeholder="0"
                  value={resultados[jogo.id]?.b ?? jogo.gols_b ?? ""}
                  onChange={(e) =>
                    setResultados((atual) => ({
                      ...atual,
                      [jogo.id]: {
                        ...atual[jogo.id],
                        b: e.target.value,
                      },
                    }))
                  }
                />

                <button
                  onClick={() => salvarResultado(jogo)}
                  className="ml-3 bg-purple-600 text-white px-4 py-2 rounded"
                >
                  Salvar Resultado
                </button>
              </div>

              <p className="mt-2 text-sm">
                {jogo.encerrado ? "✅ Jogo encerrado" : "⏳ Resultado ainda não lançado"}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}