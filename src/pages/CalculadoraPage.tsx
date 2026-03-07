import { useState } from 'react'
import { formatCurrency, formatBRL, parseBRL } from '../lib/utils'
import Icon from '../components/ui/Icon'

const TAXA_CARTAO: Record<number, number> = { 1: 0, 2: 2.99, 3: 3.99, 6: 6.99, 10: 10.99, 12: 13.99 }
const PARCELAS_OPTIONS = [1, 2, 3, 6, 10, 12]

const inputStyle = {
  border: '1px solid #EDE8E0', borderRadius: 12, padding: '12px 14px',
  fontSize: 15, outline: 'none', fontFamily: 'Nunito, sans-serif',
  color: '#4A443F', width: '100%', background: '#fff', boxSizing: 'border-box' as const,
}

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 760 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#4A443F' }}>Calculadora de Margem</h1>
        <p style={{ margin: '4px 0 0', color: '#9A948E', fontSize: 14 }}>
          A taxa da maquininha é repassada ao cliente — você sempre recebe o valor base.
        </p>
      </div>

      <div className="card">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Preço de Compra (R$)
            </label>
            <input type="text" inputMode="numeric" value={precoCompra} onChange={(e) => setPrecoCompra(formatBRL(e.target.value))} placeholder="0,00" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Preço de Venda — Base PIX (R$)
            </label>
            <input type="text" inputMode="numeric" value={precoVenda} onChange={(e) => setPrecoVenda(formatBRL(e.target.value))} placeholder="0,00" style={inputStyle} />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
              Forma de Pagamento
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['PIX', 'Cartão'] as const).map((p) => (
                <button key={p} onClick={() => { setPagamento(p); if (p === 'PIX') setParcelas(1) }}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 12, fontSize: 13, fontWeight: 700,
                    border: `2px solid ${pagamento === p ? '#5D6D3E' : '#EDE8E0'}`,
                    background: pagamento === p ? '#EEF3E5' : '#fff',
                    color: pagamento === p ? '#5D6D3E' : '#9A948E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                  <Icon name={p === 'PIX' ? 'qr_code' : 'credit_card'} size={16} style={{ color: pagamento === p ? '#5D6D3E' : '#B5AFA9' }} />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {pagamento === 'Cartão' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>
                Parcelas
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PARCELAS_OPTIONS.map((p) => (
                  <button key={p} onClick={() => setParcelas(p)}
                    style={{
                      padding: '8px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                      border: `2px solid ${parcelas === p ? '#5D6D3E' : '#EDE8E0'}`,
                      background: parcelas === p ? '#5D6D3E' : '#fff',
                      color: parcelas === p ? '#fff' : '#9A948E',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}>
                    {p}x
                  </button>
                ))}
              </div>
              {taxa > 0 && (
                <p style={{ fontSize: 12, color: '#9A948E', marginTop: 8 }}>
                  Taxa: <strong style={{ color: '#4A443F' }}>{taxa}%</strong> — cobrada do cliente
                </p>
              )}
            </div>
          )}

          <div style={{ gridColumn: pagamento === 'Cartão' ? '1 / -1' : '1 / -1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Comissão do Vendedor: {comissao}%
              </label>
              <span style={{ fontSize: 13, color: '#9A948E' }}>{comissao > 0 ? `− ${formatCurrency(comissaoValor)}` : 'Sem comissão'}</span>
            </div>
            <input type="range" min={0} max={15} step={0.5} value={comissao} onChange={(e) => setComissao(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#5D6D3E', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B5AFA9', fontSize: 11, marginTop: 4 }}>
              <span>0%</span><span>5%</span><span>10%</span><span>15%</span>
            </div>
          </div>
        </div>
      </div>

      {(compra > 0 || venda > 0) && (
        <>
          {margemBaixa && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderRadius: 16, padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FCD34D' }}>
              <Icon name="warning" size={20} style={{ color: '#D97706', flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 700, color: '#92400E', fontSize: 13, margin: 0 }}>Margem abaixo de 8%</p>
                <p style={{ color: '#78350F', fontSize: 12, margin: 0 }}>Atenção: essa operação tem margem muito baixa. Revise o preço de venda.</p>
              </div>
            </div>
          )}

          <div className="card" style={{ border: `2px solid ${margemBaixa ? '#FCD34D' : lucro > 0 ? '#A8C882' : '#FECACA'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EEF3E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="calculate" size={22} style={{ color: '#5D6D3E' }} />
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#4A443F' }}>Resultado</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: pagamento === 'Cartão' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Lucro Líquido', value: formatCurrency(lucro), color: lucro > 0 ? '#16A34A' : '#DC2626', bg: lucro > 0 ? '#F0FDF4' : '#FEF2F2' },
                { label: 'Margem %', value: `${margem.toFixed(1)}%`, color: margemBaixa ? '#D97706' : '#16A34A', bg: margemBaixa ? '#FFFBEB' : '#F0FDF4' },
                ...(pagamento === 'Cartão'
                  ? [
                    { label: 'Cobrar do Cliente', value: formatCurrency(valorCliente), color: '#0EA5E9', bg: '#EBF5FB' },
                    { label: 'Taxa Cartão', value: `${taxa}%`, color: '#9A948E', bg: '#FAF7F2' },
                  ]
                  : [{ label: 'Valor PIX', value: formatCurrency(venda), color: '#16A34A', bg: '#F0FDF4' }]
                ),
              ].map((k) => (
                <div key={k.label} style={{ borderRadius: 14, padding: '14px 16px', background: k.bg, border: `1px solid ${k.bg}` }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: k.color, fontFamily: 'Quicksand, sans-serif' }}>{k.value}</p>
                  {k.label === 'Cobrar do Cliente' && parcelas > 1 && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#9A948E' }}>{parcelas}× {formatCurrency(valorPorParcela)}/mês</p>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderRadius: 14, padding: '16px', background: '#FAF7F2', border: '1px solid #F0EBE3' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, marginTop: 0 }}>Breakdown</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#9A948E' }}>Preço base recebido</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#4A443F' }}>{formatCurrency(venda)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 14, color: '#9A948E' }}>Preço de compra</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>− {formatCurrency(compra)}</span>
                </div>
                {comissao > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 14, color: '#9A948E' }}>Comissão ({comissao}%)</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>− {formatCurrency(comissaoValor)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #EDE8E0', paddingTop: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#4A443F' }}>Lucro Final</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: lucro > 0 ? '#16A34A' : '#DC2626', fontFamily: 'Quicksand, sans-serif' }}>{formatCurrency(lucro)}</span>
                </div>
              </div>
            </div>

            {pagamento === 'Cartão' && parcelas > 1 && (
              <div style={{ marginTop: 12, borderRadius: 12, padding: '12px 14px', background: '#EEF3E5', border: '1px solid #A8C882', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon name="credit_card" size={16} style={{ color: '#5D6D3E' }} />
                <p style={{ margin: 0, fontSize: 14, color: '#5D6D3E', fontWeight: 600 }}>
                  Cobrar do cliente: <strong>{formatCurrency(valorCliente)}</strong> ({parcelas}× de <strong>{formatCurrency(valorPorParcela)}</strong>/mês)
                </p>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EBE3' }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#4A443F' }}>Tabela Completa de Taxas</h2>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#FAF7F2' }}>
                    {['Parcelas', 'Taxa', 'Vendedor Recebe', `Cliente Paga (base ${formatCurrency(venda || 2500)})`].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', borderBottom: '1px solid #F0EBE3', fontSize: 11, fontWeight: 700, color: '#9A948E', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PARCELAS_OPTIONS.map((p) => {
                    const t = TAXA_CARTAO[p]
                    const base = venda || 2500
                    const clientePaga = base * (1 + t / 100)
                    const isActive = pagamento === 'Cartão' && parcelas === p
                    return (
                      <tr key={p} className="row-hover" style={{ background: isActive ? '#EEF3E5' : 'transparent', fontWeight: isActive ? 700 : 400 }}>
                        <td style={{ padding: '10px 16px', color: '#4A443F' }}>{p}×</td>
                        <td style={{ padding: '10px 16px', color: '#9A948E' }}>{t}%</td>
                        <td style={{ padding: '10px 16px', color: '#16A34A', fontWeight: 700 }}>{formatCurrency(base)}</td>
                        <td style={{ padding: '10px 16px', color: t > 0 ? '#D97706' : '#16A34A', fontWeight: 700 }}>
                          {formatCurrency(clientePaga)}
                          {t > 0 && <span style={{ fontSize: 12, color: '#B5AFA9', marginLeft: 6 }}>+{formatCurrency(clientePaga - base)}</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
