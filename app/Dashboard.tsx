"use client";

import { Fragment, useMemo, useRef, useState, useTransition } from "react";
import StrawberryMark from "./StrawberryMark";
import { criarLancamento, removerLancamento, atualizarOrcamento } from "./actions";
import {
  DESPESA_CATEGORIAS,
  RECEITA_CATEGORIAS,
  FORMAS_PAGAMENTO,
} from "@/lib/categories";
import type { Lancamento, TipoLancamento } from "@/lib/db";

const fmtMoney = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" });
const fmtDay = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function statusFor(pct: number) {
  if (pct > 1) return { cls: "critical", pill: "critical" as const, label: "Estourou", icon: "⚠" };
  if (pct >= 0.8) return { cls: "warning", pill: "warning" as const, label: "Atenção", icon: "●" };
  return { cls: "", pill: "good" as const, label: "Tranquilo", icon: "✓" };
}

export default function Dashboard({
  initialLancamentos,
  initialOrcamentos,
}: {
  initialLancamentos: Lancamento[];
  initialOrcamentos: Record<string, number>;
}) {
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [tipo, setTipo] = useState<TipoLancamento>("receita");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const entries = initialLancamentos;
  const budgets = initialOrcamentos;

  function shiftMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    setMonth(monthKey(new Date(y, m - 1 + delta, 1)));
  }

  const monthLabel = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    return capitalize(fmtMonth.format(new Date(y, m - 1, 1)));
  }, [month]);

  const entriesThisMonth = useMemo(
    () => entries.filter((e) => e.data.slice(0, 7) === month),
    [entries, month]
  );

  const { totalReceitas, totalDespesas, saldo } = useMemo(() => {
    let receitas = 0;
    let despesas = 0;
    for (const e of entriesThisMonth) {
      if (e.tipo === "receita") receitas += e.valor;
      else despesas += e.valor;
    }
    return { totalReceitas: receitas, totalDespesas: despesas, saldo: receitas - despesas };
  }, [entriesThisMonth]);

  const budgetRows = useMemo(() => {
    const spentByCat: Record<string, number> = {};
    for (const e of entriesThisMonth) {
      if (e.tipo !== "despesa") continue;
      spentByCat[e.categoria] = (spentByCat[e.categoria] || 0) + e.valor;
    }
    return DESPESA_CATEGORIAS.map((cat) => {
      const spent = spentByCat[cat] || 0;
      const budget = Number(budgets[cat]) || 0;
      const pct = budget > 0 ? spent / budget : spent > 0 ? 1.001 : 0;
      return { cat, spent, budget, pct };
    }).sort((a, b) => b.spent - a.spent);
  }, [entriesThisMonth, budgets]);

  async function handleSubmit(formData: FormData) {
    setFormError(null);
    try {
      await criarLancamento(formData);
      formRef.current?.reset();
      setTipo("receita");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Não foi possível salvar.");
    }
  }

  function handleDelete(id: number) {
    setPendingDeleteId(id);
    startTransition(async () => {
      try {
        await removerLancamento(id);
      } finally {
        setPendingDeleteId(null);
      }
    });
  }

  function handleBudgetChange(categoria: string, valor: string) {
    const num = Number(valor);
    if (!Number.isFinite(num) || num < 0) return;
    startTransition(async () => {
      await atualizarOrcamento(categoria, num);
    });
  }

  const categoriasAtuais = tipo === "receita" ? RECEITA_CATEGORIAS : DESPESA_CATEGORIAS;

  return (
    <div className="wrap">
      <header>
        <div className="brand">
          <StrawberryMark />
          <div>
            <h1>Cantinho das Contas</h1>
            <p>Controle de gastos com carinho de morango 🍃</p>
          </div>
        </div>
        <div className="month-nav">
          <button type="button" aria-label="Mês anterior" onClick={() => shiftMonth(-1)}>
            ‹
          </button>
          <span className="label">{monthLabel}</span>
          <button type="button" aria-label="Próximo mês" onClick={() => shiftMonth(1)}>
            ›
          </button>
        </div>
      </header>

      <section className="summary">
        <div className="tile receitas">
          <div className="k">Receitas do mês</div>
          <div className="v tabular">{fmtMoney.format(totalReceitas)}</div>
        </div>
        <div className="tile despesas">
          <div className="k">Despesas do mês</div>
          <div className="v tabular">{fmtMoney.format(totalDespesas)}</div>
        </div>
        <div className="tile saldo">
          <div className="k">Saldo do mês</div>
          <div className={`v tabular ${saldo >= 0 ? "pos" : "neg"}`}>{fmtMoney.format(saldo)}</div>
        </div>
      </section>

      <div className="grid">
        <div>
          <div className="card">
            <h2>
              Novo lançamento
              <small>Registre uma entrada ou saída rapidinho</small>
            </h2>
            <form className="entry" action={handleSubmit} ref={formRef}>
              <div className="full toggle">
                <button
                  type="button"
                  className={`toggle-btn receita ${tipo === "receita" ? "active" : ""}`}
                  onClick={() => setTipo("receita")}
                >
                  💰 Receita
                </button>
                <button
                  type="button"
                  className={`toggle-btn despesa ${tipo === "despesa" ? "active" : ""}`}
                  onClick={() => setTipo("despesa")}
                >
                  🧾 Despesa
                </button>
                <input type="hidden" name="tipo" value={tipo} />
              </div>

              <label>
                Data
                <input type="date" name="data" defaultValue={todayIso()} required />
              </label>
              <label>
                Valor (R$)
                <input type="number" name="valor" min="0" step="0.01" placeholder="0,00" required />
              </label>
              <label className="full">
                Descrição
                <input type="text" name="descricao" placeholder="Ex: Feira da semana" required />
              </label>
              <label>
                Categoria
                <select name="categoria" key={tipo} required>
                  {categoriasAtuais.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              {tipo === "despesa" && (
                <label>
                  Forma de pagamento
                  <select name="formaPagamento" required>
                    {FORMAS_PAGAMENTO.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="submit-row full">
                {formError ? <span className="form-error">{formError}</span> : <span />}
                <button type="submit" className="primary">
                  Adicionar
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <h2>
              Extrato do mês
              <small>
                {entriesThisMonth.length} {entriesThisMonth.length === 1 ? "lançamento" : "lançamentos"}
              </small>
            </h2>
            <div className="tx-list">
              {entriesThisMonth.length === 0 ? (
                <div className="empty">
                  Nenhum lançamento neste mês ainda. Use o formulário acima para começar 🍓
                </div>
              ) : (
                entriesThisMonth
                  .slice()
                  .sort((a, b) => b.data.localeCompare(a.data) || b.id - a.id)
                  .map((e) => {
                    const d = new Date(e.data + "T00:00:00");
                    const [dayNum, monthAbbr] = fmtDay.format(d).replace(".", "").split(" ");
                    return (
                      <div className="tx-row" key={e.id}>
                        <div className="tx-date">
                          {monthAbbr}
                          <b>{dayNum}</b>
                        </div>
                        <div className="tx-mid">
                          <div className="desc">{e.descricao}</div>
                          <div className="meta">
                            <span>{e.categoria}</span>
                            {e.tipo === "despesa" && e.formaPagamento && <span>{e.formaPagamento}</span>}
                          </div>
                        </div>
                        <div className={`tx-amount ${e.tipo} tabular`}>
                          {e.tipo === "receita" ? "+ " : "− "}
                          {fmtMoney.format(e.valor)}
                        </div>
                        <button
                          className="tx-del"
                          aria-label="Excluir lançamento"
                          title="Excluir"
                          disabled={isPending && pendingDeleteId === e.id}
                          onClick={() => handleDelete(e.id)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <h2>
            Orçamento por categoria
            <small>Comparado ao que você planejou gastar</small>
          </h2>
          <div>
            {budgetRows.map((r) => {
              const st = statusFor(r.pct);
              const width = Math.min(r.pct, 1) * 100;
              const showPill = r.spent > 0 || r.pct > 1;
              return (
                <div className="budget-row" key={r.cat}>
                  <div className="budget-head">
                    <span className="name">{r.cat}</span>
                    <span className="nums tabular">
                      <b>{fmtMoney.format(r.spent)}</b> / {fmtMoney.format(r.budget)}
                    </span>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill ${st.cls ? `status-${st.cls}` : ""}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  {showPill && (
                    <span className={`status-pill ${st.pill}`}>
                      {st.icon} {st.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <details className="budget-edit">
            <summary>Ajustar orçamentos</summary>
            <div className="edit-grid">
              {DESPESA_CATEGORIAS.map((cat) => (
                <Fragment key={cat}>
                  <label htmlFor={`budget-${cat}`}>{cat}</label>
                  <input
                    id={`budget-${cat}`}
                    type="number"
                    min="0"
                    step="10"
                    defaultValue={Number(budgets[cat]) || 0}
                    onBlur={(ev) => handleBudgetChange(cat, ev.currentTarget.value)}
                  />
                </Fragment>
              ))}
            </div>
          </details>
        </div>
      </div>

      <footer>Dados salvos no banco Postgres do projeto — acessíveis de qualquer aparelho.</footer>
    </div>
  );
}
