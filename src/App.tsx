import { useState } from 'react'
import Hero from './components/Hero'
import SimuladorForm from './components/SimuladorForm'
import RankingResultado from './components/RankingResultado'
import Footer from './components/Footer'
import type { CenarioRankeado } from './lib/calculator'

function App() {
  const [resultados, setResultados] = useState<CenarioRankeado[] | null>(null)

  return (
    <div className="flex min-h-screen flex-col">
      <Hero />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 text-left">
        <div id="simulador">
          <SimuladorForm onCompare={setResultados} />
        </div>
        {resultados && <RankingResultado resultados={resultados} />}
      </main>

      <Footer />
    </div>
  )
}

export default App
