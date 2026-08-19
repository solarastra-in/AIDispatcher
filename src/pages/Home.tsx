import React from "react";

const NAV_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#learning", label: "The algorithm" },
  { href: "#governance", label: "Governance" },
  { href: "#output", label: "Output formats" },
  { href: "#byos", label: "Bring your subscription" },
];

const STATS = [
  { num: "±1pt", label: "how close the learned quality estimate landed to true model performance after 300 real outcomes, in testing" },
  { num: "100×", label: "price spread between the cheapest and most capable models in production today" },
  { num: "3,636", label: "tokens saved by in-chat compression across a single 30-turn test conversation" },
  { num: "7", label: "provider engines supported today — Claude, GPT, Gemini, DeepSeek, Mistral, Grok, Groq" },
];

const PIPELINE = [
  { tag: "01 · CLASSIFY", title: "Understand the task", body: "A semantic classifier scores the request against task archetypes by meaning, not keyword matching — catches paraphrases a rules engine would miss entirely." },
  { tag: "02 · SELECT", title: "Pick the right model", body: "Every candidate model's learned quality estimate is sampled, and the cheapest one whose sample clears your quality bar wins — automatically balancing cost against confidence." },
  { tag: "03 · EXECUTE", title: "Call it, or your own proxy", body: "One integration point regardless of provider — including a model you're running locally under your own Claude Pro/Max or ChatGPT Plus/Pro subscription." },
  { tag: "04 · REMEMBER", title: "Compress and carry context", body: "The outcome updates the routing model's confidence, and the conversation's context is compressed and carried forward — across turns, and across sessions." },
];

const ALGO_ROWS = [
  { k: "SIGNAL", title: "Semantic task classification", body: "Similarity to labeled task archetypes, not keyword regex — a request needs no exact vocabulary overlap with any rule to be classified correctly." },
  { k: "MODEL", title: "Per-task quality estimate", body: "A live probability distribution — not a fixed score — for how well each model handles each task type, seeded with a weak prior and sharpened by every real outcome." },
  { k: "CHOICE", title: "Sampled, not greedy", body: "Selection samples from that live distribution rather than always picking today's best guess — so it keeps testing plausible alternatives instead of freezing on an early impression.", verified: false },
  { k: "RESULT", title: "Verified converging to ground truth", body: "In testing, the learned estimate for one model landed within one point of its true, independently-known success rate after 300 simulated outcomes.", verified: true },
];

const ROLE_ROWS: { capability: string; employee: string; companyAdmin: string; platformAdmin: string }[] = [
  { capability: "Route requests within budget", employee: "✓", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Select engine/model manually", employee: "If granted", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Set user & team budgets", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Restrict team to approved models", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Configure provider credentials", employee: "—", companyAdmin: "✓", platformAdmin: "✓" },
  { capability: "Onboard companies platform-wide", employee: "—", companyAdmin: "—", platformAdmin: "✓" },
];

const FORMAT_TILES = [
  { glyph: "PDF", label: "Formatted documents", note: "Headings, sections, bullets" },
  { glyph: "XLS", label: "Real spreadsheets", note: "Auto-detected from tables" },
  { glyph: "IMG", label: "Generated images", note: "Via OpenAI or Gemini" },
  { glyph: "TXT", label: "Plain response", note: "Default, always available" },
];

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-xs tracking-[0.1em] text-[#FF8A3D] uppercase mb-3.5">{children}</div>
  );
}

export default function Home() {
  return (
    <div className="bg-[#0F1216] text-[#E7E9EC] min-h-screen antialiased selection:bg-[#FF8A3D] selection:text-[#0F1216]">
      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#0F1216]/90 backdrop-blur-md border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-semibold text-[15px]">
            <span className="w-2 h-2 rounded-full bg-[#FF8A3D] shadow-[0_0_8px_#FF8A3D]" />
            WhyOr <span className="text-[#93999F] font-normal">Dispatch</span>
          </div>
          <div className="hidden md:flex gap-7 text-[13.5px] text-[#93999F]">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-[#E7E9EC]">{l.label}</a>
            ))}
          </div>
          <a href="#access" className="font-mono text-[13px] border border-[#2A2F38] px-4 py-2 rounded-sm hover:border-[#FF8A3D] hover:text-[#FF8A3D]">
            Request access
          </a>
        </div>
      </nav>

      {/* HERO */}
      <header className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>AI routing infrastructure that learns</SectionKicker>
          <h1 className="text-[32px] md:text-[54px] font-bold leading-[1.08] max-w-[860px] tracking-tight">
            Not just cheaper AI. <span className="text-[#FF8A3D]">Smarter about which AI, every time.</span>
          </h1>
          <p className="mt-5 text-[16.5px] text-[#93999F] max-w-[600px]">
            Dispatch reads each request, predicts which model will handle it well, and routes to the cheapest one
            that clears the bar — using an algorithm that gets measurably more accurate the more it's used, not a
            fixed rulebook that goes stale.
          </p>
          <div className="mt-8 flex gap-3.5 flex-wrap">
            <a href="#access" className="bg-[#FF8A3D] hover:bg-[#ffa15e] text-[#171208] font-semibold text-sm px-5.5 py-3.5 rounded-sm cursor-pointer">
              Request access
            </a>
            <a href="#how" className="border border-[#2A2F38] hover:border-[#93999F] text-[#93999F] hover:text-[#E7E9EC] text-sm px-5.5 py-3.5 rounded-sm cursor-pointer">
              See how it works
            </a>
          </div>
        </div>
      </header>

      {/* STATS */}
      <section className="border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8 grid grid-cols-2 md:grid-cols-4">
          {STATS.map((s, i) => (
            <div key={i} className={`py-8 px-6 ${i > 0 ? "border-t md:border-t-0 md:border-l border-[#2A2F38]" : ""} ${i === 0 ? "md:pl-0" : ""}`}>
              <div className="font-['Space_Grotesk'] text-[30px] font-bold text-[#FF8A3D]">{s.num}</div>
              <div className="mt-1.5 text-xs text-[#93999F] max-w-[220px]">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>How it works</SectionKicker>
          <h2 className="text-[24px] md:text-[36px] font-bold max-w-[680px]">Four steps between your prompt and the response.</h2>
          <p className="mt-4 text-[#93999F] max-w-[600px] text-[15px]">
            Routing runs as a thin decision layer in front of whichever models you already use — it doesn't replace
            them, and every decision is explainable, not a black box.
          </p>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2A2F38] border border-[#2A2F38]">
            {PIPELINE.map((step) => (
              <div key={step.tag} className="bg-[#171B21] p-6">
                <div className="font-mono text-[11px] text-[#4FD1C5]">{step.tag}</div>
                <h3 className="mt-2.5 text-[17px] font-semibold">{step.title}</h3>
                <p className="mt-2.5 text-[13px] text-[#93999F]">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE ALGORITHM */}
      <section id="learning" className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>The algorithm</SectionKicker>
          <h2 className="text-[24px] md:text-[36px] font-bold max-w-[680px]">A routing decision that improves with use — not a static lookup table.</h2>
          <p className="mt-4 text-[#93999F] max-w-[600px] text-[15px]">
            Most routers pick a model once, based on a fixed rule, and never revisit it. Dispatch tracks how well
            each model actually performs on each kind of task, and lets that evidence drive the decision.
          </p>
          <div className="mt-12 bg-[#171B21] border border-[#2A2F38] rounded p-7">
            {ALGO_ROWS.map((row, i) => (
              <div key={row.k} className={`grid grid-cols-[120px_1fr] gap-5 items-start py-3.5 ${i > 0 ? "border-t border-[#2A2F38]" : ""}`}>
                <div className="font-mono text-[11px] text-[#93999F]">{row.k}</div>
                <div>
                  <strong className="block text-[14.5px] mb-1">{row.title}</strong>
                  <span className="text-[13.5px] text-[#93999F]">{row.body}</span>
                  {row.verified && (
                    <span className="inline-block mt-1.5 font-mono text-[11px] text-[#4FD1C5] bg-[#4FD1C5]/[0.08] border border-[#245A54] px-2 py-0.5 rounded-sm">
                      ✓ tested, not asserted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GOVERNANCE */}
      <section id="governance" className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>Governance</SectionKicker>
          <h2 className="text-[24px] md:text-[36px] font-bold max-w-[680px]">Built for a company, not just a person.</h2>
          <p className="mt-4 text-[#93999F] max-w-[600px] text-[15px]">Three roles, real budgets, and model policy that's enforced — not a suggestion.</p>

          <div className="mt-12 overflow-x-auto">
            <table className="w-full text-[13px] border-collapse">
              <thead>
                <tr>
                  <th className="text-left px-4 py-3 font-mono text-[11px] text-[#93999F] uppercase tracking-wide border-b border-[#2A2F38]">Capability</th>
                  <th className="text-left px-4 py-3 font-mono text-[11px] text-[#93999F] uppercase tracking-wide border-b border-[#2A2F38]">Employee</th>
                  <th className="text-left px-4 py-3 font-mono text-[11px] text-[#93999F] uppercase tracking-wide border-b border-[#2A2F38]">Company Admin</th>
                  <th className="text-left px-4 py-3 font-mono text-[11px] text-[#93999F] uppercase tracking-wide border-b border-[#2A2F38]">Platform Admin</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_ROWS.map((r) => (
                  <tr key={r.capability}>
                    <td className="px-4 py-3 border-b border-[#2A2F38] font-medium text-[#E7E9EC]">{r.capability}</td>
                    <td className="px-4 py-3 border-b border-[#2A2F38] text-[#93999F]">{r.employee}</td>
                    <td className="px-4 py-3 border-b border-[#2A2F38] text-[#4FD1C5]">{r.companyAdmin}</td>
                    <td className="px-4 py-3 border-b border-[#2A2F38] text-[#4FD1C5]">{r.platformAdmin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* OUTPUT FORMATS */}
      <section id="output" className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>Output formats</SectionKicker>
          <h2 className="text-[24px] md:text-[36px] font-bold max-w-[680px]">Get more than plain text back — matching what Claude, Gemini, and ChatGPT already deliver.</h2>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {FORMAT_TILES.map((t) => (
              <div key={t.glyph} className="bg-[#171B21] border border-[#2A2F38] rounded p-5 text-center">
                <div className="font-mono text-xl text-[#4FD1C5] mb-2.5">{t.glyph}</div>
                <div className="text-[13px] font-semibold">{t.label}</div>
                <div className="text-[11.5px] text-[#93999F] mt-1">{t.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BYOS */}
      <section id="byos" className="py-20 border-b border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>Bring your own subscription</SectionKicker>
          <h2 className="text-[24px] md:text-[36px] font-bold max-w-[680px]">Already paying for Claude Pro or ChatGPT Plus? Use it instead of metered API cost.</h2>
          <div className="mt-12 bg-[#171B21] border border-[#2A2F38] rounded p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm text-[#FF8A3D] mb-3">WHAT THIS IS</h3>
              <ul>
                {["A local proxy you run, wrapping your already-authenticated CLI session", "Genuinely $0 marginal cost — your flat-rate subscription covers it", "Scoped to your own account only — never pooled across a team"].map((t) => (
                  <li key={t} className="text-[13.5px] text-[#93999F] py-2 border-t border-[#2A2F38] first:border-t-0 first:pt-0">{t}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm text-[#FF8A3D] mb-3">WHAT THIS ISN'T</h3>
              <ul>
                {["WhyOr does not log into your Claude or ChatGPT account", "Not offered where the provider's own terms don't allow it", "Not a shared company-wide bypass of metered billing"].map((t) => (
                  <li key={t} className="text-[13.5px] text-[#93999F] py-2 border-t border-[#2A2F38] first:border-t-0 first:pt-0">{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="access" className="pb-28 pt-20">
        <div className="max-w-[1120px] mx-auto px-8">
          <SectionKicker>Early access</SectionKicker>
          <h2 className="text-[26px] md:text-[40px] font-bold max-w-[600px]">
            Bring your own models. Dispatch decides which one earns each request — and gets better at deciding over time.
          </h2>
          <p className="mt-4 text-[#93999F] max-w-[520px] text-[15px]">
            Currently onboarding teams running mixed-model workloads.
          </p>
          <div className="mt-7 flex items-center gap-3.5 flex-wrap">
            <a href="mailto:hello@whyor.in?subject=WhyOr%20Dispatch%20—%20early%20access" className="bg-[#FF8A3D] hover:bg-[#ffa15e] text-[#171208] font-semibold text-sm px-5.5 py-3.5 rounded-sm">
              Request access
            </a>
            <span className="font-mono text-sm text-[#4FD1C5]">ai.whyor.in</span>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-[#2A2F38]">
        <div className="max-w-[1120px] mx-auto px-8 flex justify-between items-center flex-wrap gap-3">
          <div className="text-xs text-[#5B6169]">Part of the WhyOr product suite.</div>
          <div className="text-xs text-[#5B6169]">© 2026 WhyOr</div>
        </div>
      </footer>
    </div>
  );
}
