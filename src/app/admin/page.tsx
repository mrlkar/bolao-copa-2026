"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  teve_penaltis: boolean | null;
  penaltis_a: number | null;
  penaltis_b: number | null;
};

type Palpite = {
  participante_id: number;
  jogo_id: number;
  gols_time_a: number;
  gols_time_b: number;
  palpite_penaltis_a: number | null;
  palpite_penaltis_b: number | null;
};

export default function AdminPage() {
    const router = useRouter();
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);
  const [fase, setFase] = useState("Fase de Grupos");
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [resultados, setResultados] = useState<
    Record<number, { a: string; b: string; tevePenaltis: boolean; penA: string; penB: string }>
  >({});
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
        teve_penaltis: false,
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

  function calcularPontuacaoJogo(jogo: Jogo, palpite: Palpite, golsA: number, golsB: number) {
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

  function calcularPontuacaoPenaltis(palpite: Palpite, penaltisA: number, penaltisB: number) {
    const pa = palpite.palpite_penaltis_a;
    const pb = palpite.palpite_penaltis_b;

    if (pa === null || pb === null || pa === undefined || pb === undefined) return 0;

    const vencedorReal = resultadoTipo(penaltisA, penaltisB);
    const vencedorPalpite = resultadoTipo(pa, pb);

    if (vencedorReal === "E" || vencedorPalpite === "E") return 0;
    if (vencedorReal !== vencedorPalpite) return 0;
    if (pa === penaltisA && pb === penaltisB) return 3;
    if (pa === penaltisA || pb === penaltisB) return 2;

    return 1;
  }

  async function salvarResultado(jogo: Jogo) {
    setMensagem("");

    const resultado = resultados[jogo.id];

    const golsA = resultado?.a !== undefined ? resultado.a : String(jogo.gols_a ?? "");
    const golsB = resultado?.b !== undefined ? resultado.b : String(jogo.gols_b ?? "");

    if (golsA === "" || golsB === "") {
      setMensagem("Informe os dois placares do resultado.");
      return;
    }

    const tevePenaltis = resultado?.tevePenaltis ?? jogo.teve_penaltis ?? false;

    const penA = resultado?.penA !== undefined ? resultado.penA : String(jogo.penaltis_a ?? "");
    const penB = resultado?.penB !== undefined ? resultado.penB : String(jogo.penaltis_b ?? "");

    if (tevePenaltis && (penA === "" || penB === "")) {
      setMensagem("Informe o placar dos pênaltis.");
      return;
    }

    const golsANumero = Number(golsA);
    const golsBNumero = Number(golsB);
    const penANumero = tevePenaltis ? Number(penA) : null;
    const penBNumero = tevePenaltis ? Number(penB) : null;

    await supabase
      .from("jogos")
      .update({
        gols_a: golsANumero,
        gols_b: golsBNumero,
        encerrado: true,
        teve_penaltis: tevePenaltis,
        penaltis_a: penANumero,
        penaltis_b: penBNumero,
      })
      .eq("id", jogo.id);

    const { data: palpitesDoJogo } = await supabase
      .from("palpites")
      .select("*")
      .eq("jogo_id", jogo.id);

    for (const palpite of (palpitesDoJogo || []) as Palpite[]) {
      const pontosJogo = calcularPontuacaoJogo(jogo, palpite, golsANumero, golsBNumero);

      const pontosPenaltis =
        tevePenaltis && penANumero !== null && penBNumero !== null
          ? calcularPontuacaoPenaltis(palpite, penANumero, penBNumero)
          : 0;

      await supabase.from("pontuacoes").upsert(
        {
          participante_id: palpite.participante_id,
          jogo_id: jogo.id,
          pontos: pontosJogo.pontos + pontosPenaltis,
          cravada: pontosJogo.cravada,
        },
        { onConflict: "participante_id,jogo_id" }
      );
    }

    const { error: erroRecalculo } = await supabase.rpc(
  "recalcular_totais_participantes"
);

if (erroRecalculo) {
  setMensagem("Erro ao recalcular totais: " + erroRecalculo.message);
  return;
}

    setMensagem("Resultado salvo e pontuação recalculada!");
    carregarDados();
  }

  function alterarResultado(
    jogoId: number,
    campo: "a" | "b" | "tevePenaltis" | "penA" | "penB",
    valor: string | boolean
  ) {
    setResultados((atual) => ({
      ...atual,
      [jogoId]: {
        a: atual[jogoId]?.a ?? "",
        b: atual[jogoId]?.b ?? "",
        tevePenaltis: atual[jogoId]?.tevePenaltis ?? false,
        penA: atual[jogoId]?.penA ?? "",
        penB: atual[jogoId]?.penB ?? "",
        [campo]: valor,
      },
    }));
  }

  function agruparPorDia(lista: Jogo[]) {
    return lista.reduce<Record<string, Jogo[]>>((grupos, jogo) => {
      const data = new Date(jogo.data_hora).toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      if (!grupos[data]) grupos[data] = [];
      grupos[data].push(jogo);
      return grupos;
    }, {});
  }

  useEffect(() => {
  if (typeof window === "undefined") return;

  const dados = window.localStorage.getItem("participante");

  if (!dados) {
    router.push("/login");
    return;
  }

  const participante = JSON.parse(dados);

  if (!participante.administrador) {
    router.push("/painel");
    return;
  }

  carregarDados();
}, [router]);

  const participantesPagos = participantes.filter((p) => p.pago);
  const jogosEncerrados = jogos.filter((j) => j.encerrado);
  const arrecadacao = participantesPagos.length * 50;
  const jogosPorDia = agruparPorDia(jogos);

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold">🛠️ Painel Administrativo</h1>

        <section className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg">👥 Participantes</h3>
            <p>Total: {participantes.length}</p>
            <p>Pagos: {participantesPagos.length}</p>
            <p>Pendentes: {participantes.length - participantesPagos.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg">⚽ Jogos</h3>
            <p>Total: {jogos.length}</p>
            <p>Encerrados: {jogosEncerrados.length}</p>
            <p>Pendentes: {jogos.length - jogosEncerrados.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="font-bold text-lg">💰 Financeiro</h3>
            <p>Arrecadação:</p>
            <p className="text-2xl font-bold text-green-700">
              R$ {arrecadacao.toLocaleString("pt-BR")},00
            </p>
          </div>
        </section>

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

          <select
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className="w-full border rounded p-3 mb-3"
          >
            <option>Fase de Grupos</option>
            <option>2ª Fase</option>
            <option>Oitavas de Final</option>
            <option>Quartas de Final</option>
            <option>Semifinais</option>
            <option>Disputa de 3º Lugar</option>
            <option>Final</option>
          </select>

          <input
            placeholder="Seleção A"
            value={timeA}
            onChange={(e) => setTimeA(e.target.value)}
            className="w-full border rounded p-3 mb-3"
          />

          <input
            placeholder="Seleção B"
            value={timeB}
            onChange={(e) => setTimeB(e.target.value)}
            className="w-full border rounded p-3 mb-3"
          />

          <input
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            className="w-full border rounded p-3 mb-4"
          />

          <button
            onClick={cadastrarJogo}
            className="bg-green-600 text-white font-semibold px-4 py-2 rounded"
          >
            Cadastrar Jogo
          </button>

          {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Resultados dos Jogos</h2>

          {Object.entries(jogosPorDia).map(([dia, jogosDoDia]) => (
            <div key={dia} className="mb-8">
              <h3 className="text-xl font-bold mb-3 bg-slate-200 rounded p-3 capitalize">
                📅 {dia}
              </h3>

              <div className="space-y-4">
                {jogosDoDia.map((jogo) => {
                  const resultadoAtual = resultados[jogo.id];
                  const tevePenaltis =
                    resultadoAtual?.tevePenaltis ?? jogo.teve_penaltis ?? false;

                  return (
                    <div key={jogo.id} className="border rounded-lg p-4">
                      <p className="font-semibold">
                        {jogo.time_a} x {jogo.time_b}
                      </p>

                      <p className="text-sm text-gray-600 mb-3">
                        {jogo.fase} —{" "}
                        {new Date(jogo.data_hora).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          type="number"
                          min="0"
                          className="w-20 border rounded p-2 text-center"
                          placeholder="0"
                          value={resultadoAtual?.a ?? jogo.gols_a ?? ""}
                          onChange={(e) =>
                            alterarResultado(jogo.id, "a", e.target.value)
                          }
                        />

                        <span>x</span>

                        <input
                          type="number"
                          min="0"
                          className="w-20 border rounded p-2 text-center"
                          placeholder="0"
                          value={resultadoAtual?.b ?? jogo.gols_b ?? ""}
                          onChange={(e) =>
                            alterarResultado(jogo.id, "b", e.target.value)
                          }
                        />

                        <label className="ml-4 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={tevePenaltis}
                            onChange={(e) =>
                              alterarResultado(
                                jogo.id,
                                "tevePenaltis",
                                e.target.checked
                              )
                            }
                          />
                          Teve pênaltis?
                        </label>
                      </div>

                      {tevePenaltis && (
                        <div className="mt-4 bg-slate-50 rounded p-4">
                          <p className="font-medium mb-2">
                            Resultado dos pênaltis:
                          </p>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              className="w-20 border rounded p-2 text-center"
                              placeholder="0"
                              value={resultadoAtual?.penA ?? jogo.penaltis_a ?? ""}
                              onChange={(e) =>
                                alterarResultado(jogo.id, "penA", e.target.value)
                              }
                            />

                            <span>x</span>

                            <input
                              type="number"
                              min="0"
                              className="w-20 border rounded p-2 text-center"
                              placeholder="0"
                              value={resultadoAtual?.penB ?? jogo.penaltis_b ?? ""}
                              onChange={(e) =>
                                alterarResultado(jogo.id, "penB", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => salvarResultado(jogo)}
                        className="mt-4 bg-purple-600 text-white px-4 py-2 rounded"
                      >
                        Salvar Resultado
                      </button>

                      <p className="mt-2 text-sm">
                        {jogo.encerrado
                          ? "✅ Jogo encerrado"
                          : "⏳ Resultado ainda não lançado"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}