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

export default function AdminPage() {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [jogos, setJogos] = useState<Jogo[]>([]);

  const [fase, setFase] = useState("Fase de Grupos");
  const [timeA, setTimeA] = useState("");
  const [timeB, setTimeB] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [mensagem, setMensagem] = useState("");

  async function carregarDados() {
    const { data: dadosParticipantes } = await supabase
      .from("participantes")
      .select("*")
      .order("id");

    const { data: dadosJogos } = await supabase
      .from("jogos")
      .select("*")
      .order("data_hora");

    setParticipantes(dadosParticipantes || []);
    setJogos(dadosJogos || []);
  }

  async function alternarPagamento(id: number, pagoAtual: boolean) {
    await supabase
      .from("participantes")
      .update({ pago: !pagoAtual })
      .eq("id", id);

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
                <tr key={p.id} className="border-b">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.apelido}</td>
                  <td className="p-2">{p.nome_completo}</td>
                  <td className="p-2">{p.pago ? "✅" : "❌"}</td>
                  <td className="p-2">{p.administrador ? "✅" : "❌"}</td>
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
            type="text"
            placeholder="Seleção A"
            value={timeA}
            onChange={(e) => setTimeA(e.target.value)}
            className="w-full border rounded p-3 mb-3"
          />

          <input
            type="text"
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
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
          >
            Cadastrar Jogo
          </button>

          {mensagem && <p className="mt-4 font-medium">{mensagem}</p>}
        </section>

        <section className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Jogos Cadastrados</h2>

          {jogos.length === 0 ? (
            <p>Nenhum jogo cadastrado.</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fase</th>
                  <th className="text-left p-2">Jogo</th>
                  <th className="text-left p-2">Data/Hora</th>
                  <th className="text-left p-2">Resultado</th>
                </tr>
              </thead>

              <tbody>
                {jogos.map((j) => (
                  <tr key={j.id} className="border-b">
                    <td className="p-2">{j.fase}</td>
                    <td className="p-2">
                      {j.time_a} x {j.time_b}
                    </td>
                    <td className="p-2">
                      {new Date(j.data_hora).toLocaleString("pt-BR")}
                    </td>
                    <td className="p-2">
                      {j.gols_a === null || j.gols_b === null
                        ? "Ainda não informado"
                        : `${j.gols_a} x ${j.gols_b}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}