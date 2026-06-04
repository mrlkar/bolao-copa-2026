"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Participante = {
  nome_completo: string;
  apelido: string;
  email: string;
  pago: boolean;
  pontos: number;
  cravadas: number;
};

export default function PainelPage() {
  const router = useRouter();
  const [participante, setParticipante] = useState<Participante | null>(null);

  useEffect(() => {
    const dados = localStorage.getItem("participante");

    if (!dados) {
      router.push("/login");
      return;
    }

    setParticipante(JSON.parse(dados));
  }, [router]);

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
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          🏆 Bolão da Copa 2026
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Área do Participante
        </p>

        <div className="space-y-4 text-lg">
          <p>
            <strong>Olá,</strong> {participante.apelido || participante.nome_completo}!
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
        </div>

        <button
          onClick={sair}
          className="mt-8 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded"
        >
          Sair
        </button>
      </div>
    </main>
  );
}