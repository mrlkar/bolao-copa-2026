"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setMensagem("");

    if (!email.trim() || !senha.trim()) {
      setMensagem("Informe e-mail e senha.");
      return;
    }

    setCarregando(true);

    const { data, error } = await supabase
      .from("participantes")
      .select("*")
      .eq("email", email.trim())
      .eq("senha", senha)
      .single();

    setCarregando(false);

    if (error || !data) {
      setMensagem("E-mail ou senha inválidos.");
      return;
    }

    localStorage.setItem("participante", JSON.stringify(data));

    if (data.administrador) {
      router.push("/admin");
    } else {
      router.push("/painel");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          🏆 Bolão da Copa 2026
        </h1>

        <p className="text-center text-gray-600 mb-8">Entrar no sistema</p>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded p-3 mb-3"
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="w-full border rounded p-3 mb-5"
        />

        <button
          onClick={entrar}
          disabled={carregando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded"
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        {mensagem && (
          <div className="mt-5 text-center font-medium">{mensagem}</div>
        )}
      </div>
    </main>
  );
}