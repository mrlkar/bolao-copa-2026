"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [nome, setNome] = useState("");
  const [apelido, setApelido] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function criarConta() {
    setMensagem("");

    if (
      !nome.trim() ||
      !apelido.trim() ||
      !telefone.trim() ||
      !email.trim() ||
      !senha.trim() ||
      !confirmarSenha.trim()
    ) {
      setMensagem("Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    setCarregando(true);

    try {
      const { data: participanteExistente } = await supabase
        .from("participantes")
        .select("id")
        .eq("email", email)
        .limit(1);

      if (participanteExistente && participanteExistente.length > 0) {
        setMensagem("Já existe um cadastro com este e-mail.");
        setCarregando(false);
        return;
      }

      const { error } = await supabase.from("participantes").insert([
        {
          nome_completo: nome,
          apelido,
          telefone,
          email,
          senha,
          pago: false,
          administrador: false,
          pontos: 0,
          cravadas: 0,
          data_cadastro: new Date().toISOString(),
        },
      ]);

      if (error) {
        setMensagem("Erro: " + error.message);
        setCarregando(false);
        return;
      }

      setMensagem(
        "Cadastro realizado com sucesso! Aguardando confirmação do pagamento."
      );

      setNome("");
      setApelido("");
      setTelefone("");
      setEmail("");
      setSenha("");
      setConfirmarSenha("");
    } catch {
      setMensagem("Ocorreu um erro inesperado.");
    }

    setCarregando(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center mb-2">
          🏆 Bolão da Copa 2026
        </h1>

        <p className="text-center text-gray-600 mb-8">
          Cadastro de Participantes
        </p>

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
          type="text"
          placeholder="Telefone / WhatsApp"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
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
          className="w-full border rounded p-3 mb-3"
        />

        <input
          type="password"
          placeholder="Confirmar senha"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          className="w-full border rounded p-3 mb-5"
        />

        <button
          onClick={criarConta}
          disabled={carregando}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded"
        >
          {carregando ? "Cadastrando..." : "Criar Conta"}
        </button>

        {mensagem && (
          <div className="mt-5 text-center font-medium">
            {mensagem}
          </div>
        )}
      </div>
    </main>
  );
}