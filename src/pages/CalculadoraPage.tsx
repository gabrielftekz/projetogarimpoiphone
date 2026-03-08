import { useState } from 'react'
import { formatCurrency, formatBRL, parseBRL } from '../lib/utils'
import Icon from '../components/ui/Icon'

const TAXA_CARTAO: Record<number, number> = { 1: 0, 2: 2.99, 3: 3.99, 6: 6.99, 10: 10.99, 12: 13.99 }
const PARCELAS_OPTIONS = [1, 2, 3, 6, 10, 12]

const inputClassName = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-lg font-bold text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all placeholder-zinc-600"

export default function CalculadoraPage() {
  const [precoCompra, setPrecoCompra] = useState('')
  const [precoVenda, setPrecoVenda] = useState('')
  const [pagamento, setPagamento] = useState<'PIX' | 'Cartão'>('PIX')
  const [parcelas, setParcelas] = useState(1)
  const [comissao, setComissao] = useState(0)

  const compra = parseBRL(precoCompra)
  const venda = parseBRL(precoVenda)
  const taxa = pagamento === 'Cartão' ? (TAXA_CARTAO[parcelas] ?? 0) : 0
  const valorCliente = pagamento === 'Cartão' ? venda * (1 + taxa / 100) : venda
  const valorPorParcela = parcelas > 1 ? valorCliente / parcelas : valorCliente
  const comissaoValor = venda * (comissao / 100)
  const lucro = venda - compra - comissaoValor
  const margem = venda > 0 ? (lucro / venda) * 100 : 0
  const margemBaixa = margem < 8 && venda > 0 && compra > 0

  return (
    <div className="fade max-w-4xl flex flex-col gap-8 mx-auto w-full">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.15)] relative">
          <div className="absolute inset-0 bg-indigo-500/20 mix-blend-overlay blur-md rounded-2xl"></div>
          <Icon name="calculate" size={28} className="text-indigo-400 relative z-10" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Business Calculator</h1>
          <p className="text-zinc-400 mt-1 text-sm tracking-wide">
            Calculadora de margem e projeção de lucros via operação.
          </p>
        </div>
      </div>

      <div className="glass-panel p-8 relative overflow-hidden group border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none transition-opacity duration-1000 opacity-50 group-hover:opacity-100" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Preço de Compra (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">R$</span>
              <input type="text" inputMode="numeric" value={precoCompra} onChange={(e) => setPrecoCompra(formatBRL(e.target.value))} placeholder="0,00" className={`${inputClassName} pl-12 text-zinc-100`} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Preço de Venda — Base PIX (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500/50 font-bold">R$</span>
              <input type="text" inputMode="numeric" value={precoVenda} onChange={(e) => setPrecoVenda(formatBRL(e.target.value))} placeholder="0,00" className={`${inputClassName} pl-12 text-teal-400`} />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
              Modo de Operação Financeira
            </label>
            <div className="flex gap-3">
              {(['PIX', 'Cartão'] as const).map((p) => {
                const isActive = pagamento === p;
                return (
                  <button
                    key={p}
                    onClick={() => { setPagamento(p); if (p === 'PIX') setParcelas(1) }}
                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border transition-all duration-300
                      ${isActive
                        ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'border-white/10 bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white hover:border-white/20'
                      }
                    `}
                  >
                    <Icon name={p === 'PIX' ? 'qr_code' : 'credit_card'} size={18} />
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          {pagamento === 'Cartão' && (
            <div className="animate-fade">
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-3">
                Splits (Parcelas)
              </label>
              <div className="flex flex-wrap gap-2">
                {PARCELAS_OPTIONS.map((p) => {
                  const isActive = parcelas === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setParcelas(p)}
                      className={`min-w-[48px] py-2 px-3 rounded-lg text-sm font-bold border transition-all duration-300
                        ${isActive
                          ? 'border-teal-500/50 bg-teal-500/20 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.3)]'
                          : 'border-white/10 bg-white/[0.02] text-zinc-500 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      {p}x
                    </button>
                  )
                })}
              </div>
              {taxa > 0 && (
                <p className="text-xs text-zinc-500 mt-3 flex items-center gap-1.5 font-medium tracking-wide">
                  <Icon name="info" size={14} className="text-indigo-400" />
                  Gateway Fee: <strong className="text-indigo-400 font-bold">{taxa}%</strong> — Shifted to end-user.
                </p>
              )}
            </div>
          )}

          <div className="md:col-span-2 mt-4 glass-panel p-5 bg-white/[0.02] border-white/5">
            <div className="flex justify-between items-center mb-4">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
                Comissão do Vendedor: <span className="text-white">{comissao}%</span>
              </label>
              <span className="text-sm font-bold text-red-400/80 tracking-wide">{comissao > 0 ? `− ${formatCurrency(comissaoValor)}` : 'N/A'}</span>
            </div>

            <input
              type="range"
              min={0} max={15} step={0.5}
              value={comissao}
              onChange={(e) => setComissao(Number(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-400 hover:accent-teal-300 transition-all"
            />
            <div className="flex justify-between text-[10px] font-bold text-zinc-500 mt-3 tracking-widest">
              <span>0%</span><span>5%</span><span>10%</span><span>15%</span>
            </div>
          </div>

        </div>
      </div>

      {(compra > 0 || venda > 0) && (
        <div className="animate-fade flex flex-col gap-6">
          {margemBaixa && (
            <div className="flex items-center gap-4 rounded-2xl p-4 md:p-5 bg-amber-500/10 border border-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Icon name="warning" size={20} className="text-amber-400" />
              </div>
              <div>
                <p className="font-bold text-amber-400 text-sm tracking-wide m-0">Low Margin Alert (&lt; 8%)</p>
                <p className="text-amber-500/70 text-xs mt-0.5 tracking-wide m-0">This operation yields very low net profitability. Review pricing model.</p>
              </div>
            </div>
          )}

          <div className={`glass-panel p-8 md:p-10 border transition-colors duration-500 ${margemBaixa ? 'border-amber-500/30 bg-amber-500/[0.02]' : lucro > 0 ? 'border-teal-500/30 bg-teal-500/[0.02]' : 'border-red-500/30 bg-red-500/[0.02]'}`}>
            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3 mb-8">
              <Icon name="monitoring" size={24} className={lucro > 0 ? 'text-teal-400' : 'text-red-400'} /> Projection Outcome
            </h2>

            <div className={`grid grid-cols-2 ${pagamento === 'Cartão' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 md:gap-6 mb-8`}>
              {[
                { label: 'Lucro Líquido', value: formatCurrency(lucro), color: lucro > 0 ? 'text-teal-400' : 'text-red-400', bg: 'bg-white/[0.02] border-white/5' },
                { label: 'Margem %', value: `${margem.toFixed(1)}%`, color: margemBaixa ? 'text-amber-400' : 'text-teal-400', bg: 'bg-white/[0.02] border-white/5' },
                ...(pagamento === 'Cartão'
                  ? [
                    { label: 'Total Client To Pay', value: formatCurrency(valorCliente), color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/10' },
                    { label: 'Gateway Fee', value: `${taxa}%`, color: 'text-zinc-500', bg: 'bg-white/[0.02] border-white/5' },
                  ]
                  : [{ label: 'PIX Final', value: formatCurrency(venda), color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' }]
                ),
              ].map((k) => (
                <div key={k.label} className={`rounded-2xl p-5 border shadow-inner ${k.bg}`}>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">{k.label}</p>
                  <p className={`text-2xl font-black tracking-tight ${k.color}`}>{k.value}</p>
                  {k.label === 'Total Client To Pay' && parcelas > 1 && (
                    <p className="text-[10px] font-bold text-indigo-400/80 uppercase tracking-widest mt-2">
                      {parcelas}× {formatCurrency(valorPorParcela)}/m
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-6 bg-white/[0.02] border border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Financial Breakdown</p>
              <div className="flex flex-col gap-3 font-mono text-xs tracking-wider">
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-400">Net Rev (Base PIX)</span>
                  <span className="font-bold text-white">{formatCurrency(venda)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-zinc-500">Capital Cost (COGS)</span>
                  <span className="font-bold text-red-400">− {formatCurrency(compra)}</span>
                </div>
                {comissao > 0 && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-zinc-500">Sales Comission ({comissao}%)</span>
                    <span className="font-bold text-red-400/80">− {formatCurrency(comissaoValor)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-2 border-t border-white/10">
                  <span className="font-black text-white uppercase tracking-widest text-sm font-sans">EBITDA (Est.)</span>
                  <span className={`text-xl font-black ${lucro > 0 ? 'text-teal-400' : 'text-red-400'} font-sans tracking-tight`}>{formatCurrency(lucro)}</span>
                </div>
              </div>
            </div>

            {pagamento === 'Cartão' && parcelas > 1 && (
              <div className="mt-4 rounded-xl p-4 bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <Icon name="credit_card" size={16} className="text-indigo-400" />
                </div>
                <p className="text-sm text-indigo-300 m-0">
                  Cobrar na maquininha o valor exato de <strong className="text-indigo-400 font-bold">{formatCurrency(valorCliente)}</strong> em {parcelas} vezes.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}
