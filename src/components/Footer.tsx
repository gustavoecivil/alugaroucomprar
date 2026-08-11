export default function Footer() {
  return (
    <footer className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <img src="/branding/logo-branca.png" alt="GSA" className="h-auto w-20 opacity-80" />

      <p className="text-sm" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)', opacity: 0.7 }}>
        GSA — Gustavo Santos Analytics · Cultura Data-Driven
      </p>

      <p className="text-xs" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-body)', opacity: 0.5 }}>
        Quer ir além da simulação?{' '}
        <a
          href="https://gustavosantos.net.br"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-[var(--accent)]"
        >
          Fale com a GSA
        </a>
      </p>
    </footer>
  )
}
