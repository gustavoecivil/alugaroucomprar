# Simulador Data-Driven de Mobilidade — GSA
## Documento de arquitetura e contexto do projeto

> Este arquivo existe pra qualquer sessão nova do Claude Code (ou de qualquer
> outra IA) entender o projeto inteiro sem precisar reconstruir contexto do
> zero. Mantenha atualizado conforme decisões novas forem tomadas.

---

## 1. O que é este produto

Um simulador que compara **Comprar × Locar × Assinar** um veículo pelo custo
real mensal equivalente — considerando preço, prazo, revenda, financiamento,
combustível, manutenção, risco de desvalorização e risco de sinistro/roubo.

**Diferencial**: cada campo é alimentado por **dado público real** (não
estimativa genérica) sempre que existir fonte confiável — FIPE, ANP, IBGE,
INMETRO, ANEEL, SUSEP, SENATRAN, Banco Central. Onde não existe dado público
(ex: preço de aluguel de locadora), o usuário preenche manualmente, com apoio
de links pra fontes reais de consulta.

**Não é** uma calculadora genérica de mercado. É uma ferramenta de decisão
financeira, com rigor de dado por trás — a mesma lógica da metodologia
"Cultura Data-Driven" (evidência real → decisão, não achismo).

---

## 2. Modelo de negócio

Três frentes de monetização, nesta ordem de prioridade (mais alinhado → menos
alinhado com a proposta de rigor do produto):

1. **Indicação/afiliado** — comissão por lead ou conversão em parceiros reais
   (corretor de seguro, comparador de financiamento, locadora). Sempre
   contextual: só aparece quando o usuário já está naquele campo específico.
2. **Posição patrocinada, com selo obrigatório "Parceiro"** — nunca escondido,
   nunca disfarçado de dado neutro.
3. **Publicidade genérica de rede** (ex: AdSense) — último recurso, evitar se
   possível, risco de baratear a percepção do produto.

Monetização "mãe", que já existia antes de tudo isso: funil pra consultoria
GSA (Cultura Data-Driven) — quem quiser ir além da simulação, procura os
serviços da GSA.

**Nunca**: apresentar dado patrocinado como se fosse neutro/oficial. A
credibilidade do rigor de dado é o próprio ativo do produto — vender isso
escondido destrói o que sustenta o negócio inteiro.

---

## 3. Arquitetura técnica — dois repositórios

### `alugaroucomprar` (frontend, React + Vite + TypeScript)
- Repositório: `github.com/gustavoecivil/alugaroucomprar`
- Deploy: Netlify, `alugaroucomprar.netlify.app`, deploy automático a cada
  push (GitHub → Netlify conectado, não é mais upload manual de zip)
- Local: `D:\alugaroucomprar` *(confirmar se já migrado de C: — se não, migrar
  seguindo o mesmo processo já usado no indice-gsa-veicular)*

### `indice-gsa-veicular` (dados, Python + DuckDB)
- Repositório: `github.com/gustavoecivil/indice-gsa-veicular`
- Local: `D:\indice-gsa-veicular`
- Banco: `data/processed/indice_gsa.duckdb` (via junção de pasta apontando
  pra `D:\indice-gsa-veicular-data\`, não fisicamente dentro do repo)
- Ambiente: `venv` próprio, `requirements.txt` no repo

**Os dois projetos não se conectam em tempo real.** O `indice-gsa-veicular`
processa os dados; scripts de export (`scripts/exportar_*.py`) geram
snapshots JSON estáticos, copiados manualmente/por script pro
`alugaroucomprar/public/dados/`. Isso mantém o site 100% estático (sem
servidor de dado rodando), rápido, sem dependência externa em produção.

---

## 4. Estrutura de pastas — `alugaroucomprar`

```
alugaroucomprar/
├── src/
│   ├── components/
│   │   ├── FipeAutofill.tsx          (marca/modelo/ano → preço, consumo, combustível)
│   │   ├── CombustivelAutofill.tsx   (UF + combustível → preço, consumo)
│   │   ├── SimuladorForm.tsx         (formulário principal, os 4 blocos)
│   │   ├── RankingResultado.tsx      (cards de resultado, ranking)
│   │   ├── Hero.tsx                  (topo da página — EM REDESIGN, ver seção 6)
│   │   ├── Footer.tsx
│   │   ├── InfoTooltip.tsx           (tooltip reutilizável, balão customizado)
│   │   └── ValorComFonte.tsx         (NOVO — componente reutilizável: input
│   │                                  manual + autofill de dado público OU
│   │                                  links de parceiro, ver seção 5)
│   ├── lib/
│   │   ├── calculator/
│   │   │   ├── types.ts
│   │   │   ├── risco.ts              (risco desvalorização FIPE + sinistro/roubo SUSEP)
│   │   │   ├── comprar.ts / locar.ts / assinar.ts
│   │   │   └── index.ts
│   │   ├── glossario.ts
│   │   ├── formatCurrency.ts
│   │   └── perfilUso.ts              (NOVO — km/ano por perfil de uso)
│   └── App.tsx
├── public/
│   ├── branding/                     (logo, favicon)
│   └── dados/                        (snapshots JSON vindos do indice-gsa-veicular)
│       ├── precos-combustivel.json   (ANP)
│       ├── consumo-veiculos.json     (INMETRO)
│       ├── tarifa-eletrica.json      (ANEEL)
│       ├── risco-susep.json          (SUSEP)
│       ├── modelos-permitidos.json   (PLANEJADO — restrição por modelo)
│       └── taxa-financiamento.json   (PLANEJADO — BCB)
├── scripts/                          (scripts Python de export, rodados manual
│                                      ou via agendamento, lendo o DuckDB do
│                                      outro repo e gerando os JSON acima)
├── netlify/functions/                (proxy pra API FIPE — evita CORS/expõe
│                                      rate limit)
└── docs/
    └── DECISOES.md
```

---

## 5. Componente-chave pendente: `ValorComFonte`

Componente genérico, reutilizável em todo campo de preço externo (seguro,
financiamento, mensalidade de locação/assinatura). Duas camadas sempre
presentes:

- **Manual**: input numérico normal — usuário digita valor próprio (com
  desconto, condição especial etc.)
- **Apoio**: autofill de dado público quando existir (ex: taxa BCB pra
  financiamento) OU links pra parceiros/comparadores reais quando não existir
  dado público (ex: Loovi/Compara pra seguro, Rentcars/Localiza pra locação)

Nunca força — sempre sugestão, sempre editável por cima.

---

## 6. Design — pendente de redesign

**Feedback do usuário**: o visual atual (hero dramático, carro emergindo da
escuridão, dourado forte) está "sensacionalista" — não combina com o
propósito real do produto (ferramenta de decisão financeira/comparação de
preço, público que quer seriedade, não impacto visual).

**Direção nova**: mais sóbrio, mais profissional — pensar em referência tipo
painel financeiro/relatório executivo, não landing page de startup. Manter a
identidade GSA (paleta já extraída: `#010101` fundo, `#f5f5f5` texto,
`#e0af3b` dourado, `#00b0d5` ciano) mas com **muito mais moderação** no uso do
dourado — reservar pra destaque pontual (valor de resultado, CTA), não pra
elemento decorativo grande como o hero atual.

*Isso ainda não foi implementado — é a próxima decisão de design a discutir
antes de mexer no código do Hero.tsx.*

---

## 7. Fontes de dado já integradas (Índice GSA)

| Fonte | O que fornece | Status |
|---|---|---|
| FIPE | Preço e histórico de depreciação | ✅ Integrado, autofill ativo |
| ANP | Preço de combustível por UF | ✅ Integrado, autofill ativo |
| IBGE | Custo de manutenção por região | ✅ Integrado no Índice GSA |
| INMETRO/PBEV | Consumo (km/l) por modelo | ✅ Integrado, autofill ativo |
| ANEEL | Tarifa de energia elétrica por UF | ✅ Integrado, autofill ativo |
| SUSEP | Risco de sinistro/roubo por categoria | ✅ Integrado, exibido separado |
| SENATRAN | Frota e acidentes | ✅ Integrado no Índice GSA (não conectado ao simulador ainda) |
| Banco Central | Taxa de juros de financiamento | ⏳ Planejado |
| Secretarias da Fazenda (por UF) | IPVA e outros impostos/taxas de compra | ⏳ Planejado — investigar se existe fonte agregada nacional (ex: portal de algum órgão que já consolide as 27 alíquotas) antes de ingerir estado por estado individualmente |

Documentação completa de cada fonte: `indice-gsa-veicular/docs/FONTES.md`

---

## 8. Roadmap — próximos passos, em ordem de prioridade

1. **Perfil de Uso** (particular/app/fim de semana/trabalho) — ajusta km/ano
   automaticamente, é o elo que conecta "dado real" com "decisão real do
   usuário" (uso muda o resultado do jeito certo)
2. **`ValorComFonte`** — construir o componente, aplicar primeiro na taxa de
   financiamento (BCB, dado público, sem depender de parceria)
2.5. **IPVA e outros impostos de compra** — autofill do campo "IPVA anual"
   por UF, dado público (cada estado define a alíquota por lei) — mesma
   prioridade do BCB, sem depender de parceria comercial
3. **Restrição de catálogo** — só anos-modelo dos últimos 3 anos (perfil real
   de carro de locadora, ABLA confirma idade média de 16,4 meses)
4. **Redesign do Hero/visual geral** — tom mais profissional, menos
   sensacionalista (ver seção 6)
5. **Aplicar `ValorComFonte` nos demais campos** — seguro (link Loovi/Compara),
   locação/assinatura (link Rentcars/Localiza/Movida/Unidas + robô Python de
   média de preço)
6. **Parcerias comerciais** — Loovi (contato: Célio Brasil, executivo
   comercial, BH, via LinkedIn/WhatsApp), corretoras multi-seguradora
   (ComparaOnline), comparadores de financiamento (Comparabem)
7. **Perfil de uso "app" com estudo específico** — Uber/99, km muito acima da
   média, merece análise própria

---

## 9. Infraestrutura de execução

- **Antigravity IDE** — editor usado, com dois terminais: `powershell` (git,
  comandos manuais) e `claude` (Claude Code, tarefas de código real)
- **OpenCode + modelo grátis** (`gpt-oss-20b:free`, via OpenRouter) — tarefas
  mecânicas simples (mover arquivo, git básico). Verificar `/models` antes de
  cada sessão, modelos gratuitos mudam de disponibilidade sem aviso.
- **Claude Code** (crédito pago, Claude Pro) — lógica de código real,
  investigação de fonte de dado, decisões técnicas
- **Claude in Chrome** — testes visuais no navegador, navegação de páginas
  públicas (ex: investigar formato de URL de comparadores)
- Regra de escalonamento: 2 tentativas falhas na mesma tarefa com modelo
  grátis → sobe pra Claude Code

---

## 10. Domínio

Hoje: `alugaroucomprar.netlify.app` (grátis, Netlify).
Considerando compra de domínio próprio — decisão amarrada a conseguir
patrocínio/parceria que justifique o investimento.
