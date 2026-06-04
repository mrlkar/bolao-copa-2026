"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CadastroPage() {
  const router = useRouter();

  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    setMensagem("");

    if (!nome || !apelido || !email || !senha) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    const { error } = await supabase.from("participantes").insert([
      {
        nome_completo: nome,
        apelido,
        email,
        senha,
        pago: false,
        administrador: false,
        pontos: 0,
        cravadas: 0,
      },
    ]);

    setCarregando(false);

    if (error) {
      setMensagem(error.message);
      return;
    }

    setMensagem(
      "Cadastro realizado com sucesso! Aguarde a confirmação do pagamento."
    );

    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">
          🏆 Cadastro no Bolão
        </h1>

        <input
          type="text"
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border rounded p-3 mb-3"
        />

        <input
          type="text"
          placeholder="Apelido"
          value={apelido}
          onChange={(e) => setApelido(e.target.value)}
          className="w-full border rounded p-3 mb-3"
        />

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
          className="w-full border rounded p-3 mb-4"
        />

        <button
          onClick={cadastrar}
          disabled={carregando}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded"
        >
          {carregando ? "Cadastrando..." : "Criar Conta"}
        </button>

        {mensagem && (
          <p className="mt-4 text-center font-medium">
            {mensagem}
          </p>
        )}
      </div>
    </main>
  );
}