function handleSimularClick() {
  document.getElementById('simulador')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Hero() {
  return (
    <section
      className="relative flex min-h-[70vh] items-end bg-cover bg-center px-4 pb-16"
      style={{ backgroundImage: "url('/branding/hero-carro.png')" }}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--background))' }}
      />

      <div className="relative flex w-full max-w-5xl flex-col items-start gap-4 text-left md:w-2/3 lg:w-1/2">
        <img src="/branding/logo-branca.png" alt="GSA" className="h-auto w-32" />

        <h1 className="text-4xl font-bold sm:text-5xl" style={{ color: 'var(--foreground)' }}>
          Comprar, locar ou assinar?
        </h1>

        <p className="text-base" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)' }}>
          Simule o custo real de cada decisão antes de escolher.
        </p>

        <button
          type="button"
          onClick={handleSimularClick}
          className="mt-2 rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
        >
          Simular agora
        </button>
      </div>
    </section>
  )
}
