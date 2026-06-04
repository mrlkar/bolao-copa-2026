export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto p-6">

        <h1 className="text-4xl font-bold text-center text-blue-900 mb-6">
          🏆 Bolão da Copa 2026
        </h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Informações Gerais
          </h2>

          <p><strong>Participantes:</strong> 0 / 50</p>
          <p><strong>Arrecadação:</strong> R$ 0,00</p>
          <p><strong>Vagas restantes:</strong> 50</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            Ranking Geral
          </h2>

          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Posição</th>
                <th className="text-left py-2">Participante</th>
                <th className="text-left py-2">Pontos</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="py-2">🥇</td>
                <td>---</td>
                <td>0</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Próximos Jogos
          </h2>

          <p>Nenhum jogo cadastrado.</p>
        </div>

      </div>
    </main>
  );
}