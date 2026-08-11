function App() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <header className="flex flex-col items-center">
        <img
          src="/branding/logo-branca.png"
          alt="GSA"
          className="h-auto w-full max-w-[280px]"
        />
      </header>
      <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>
        Simulador Data-Driven de Mobilidade
      </h1>
      <p style={{ color: 'var(--foreground)' }}>GSA — em reconstrução</p>
    </div>
  )
}

export default App
