import { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import Icon from '../components/ui/Icon'
import type { ChatMessage, Aparelho } from '../types'

const WEBHOOK_URL = 'https://webhook.francoia.shop/webhook/whatsapp-mensagens'

const QUICK_CHIPS = [
  'Qual o iPhone mais barato?',
  'Calcular parcelas no crédito',
  'Aparelhos com bateria baixa',
  'Quanto vale um iPhone 13?',
]

function formatMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>')
}

export default function AssistentePage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'assistant',
      content: 'Olá! Sou o assistente TEKZ. Posso buscar aparelhos no estoque, garimpar preços em grupos do WhatsApp, calcular parcelas e avaliar usados. Como posso ajudar?',
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [recentAparelhos, setRecentAparelhos] = useState<Aparelho[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase
      .from('aparelhos')
      .select('*')
      .eq('status', 'Disponível')
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => setRecentAparelhos((data ?? []) as Aparelho[]))
  }, [])

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      navigate('/assistente', { replace: true })
      sendMessage(q)
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setSending(true)

    const loadingId = (Date.now() + 1).toString()
    setMessages((prev) => [
      ...prev,
      { id: loadingId, role: 'assistant', content: '...', timestamp: new Date() },
    ])

    try {
      const { data } = await axios.post(
        WEBHOOK_URL,
        { pergunta: text.trim(), vendedor_id: profile?.id ?? '' },
        { timeout: 30000 }
      )
      const responseText =
        typeof data === 'string'
          ? data
          : data?.resposta ?? data?.response ?? data?.message ?? JSON.stringify(data)

      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: responseText, timestamp: new Date() }
            : m
        )
      )
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === loadingId
            ? { ...m, content: 'Não foi possível conectar ao assistente no momento. Tente novamente.', timestamp: new Date() }
            : m
        )
      )
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 64px - 64px - 64px)', minHeight: 520 }}>
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #F0EBE3' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEF3E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="smart_toy" size={20} style={{ color: '#5D6D3E' }} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#4A443F', margin: 0 }}>Assistente IA</p>
            <p style={{ fontSize: 12, color: '#16A34A', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Online
            </p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                background: msg.role === 'user' ? '#5D6D3E' : '#EEF3E5',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name={msg.role === 'user' ? 'person' : 'smart_toy'} size={14} style={{ color: msg.role === 'user' ? '#fff' : '#5D6D3E' }} />
              </div>
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                background: msg.role === 'user' ? '#5D6D3E' : '#fff',
                color: msg.role === 'user' ? '#fff' : '#4A443F',
                border: msg.role === 'assistant' ? '1px solid #F0EBE3' : 'none',
                fontSize: 14,
                lineHeight: 1.5,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                {msg.content === '...' ? (
                  <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    <span className="pulse-dot" style={{ animationDelay: '0ms' }} />
                    <span className="pulse-dot" style={{ animationDelay: '200ms' }} />
                    <span className="pulse-dot" style={{ animationDelay: '400ms' }} />
                  </span>
                ) : (
                  <p dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} style={{ margin: 0 }} />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div style={{ borderTop: '1px solid #F0EBE3', padding: '12px 20px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={sending}
                className="quick-chip"
              >
                {chip}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte algo ao assistente..."
              disabled={sending}
              style={{
                flex: 1,
                border: '1px solid #EDE8E0',
                borderRadius: 12,
                padding: '10px 16px',
                fontSize: 14,
                color: '#4A443F',
                outline: 'none',
                background: '#FAF7F2',
                fontFamily: 'Nunito, sans-serif',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary"
              style={{ padding: '10px 16px', borderRadius: 12, opacity: !input.trim() || sending ? 0.5 : 1 }}
            >
              <Icon name="send" size={18} />
            </button>
          </form>
        </div>
      </div>

      <div style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0EBE3', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Icon name="inventory_2" size={16} style={{ color: '#5D6D3E' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4A443F' }}>Estoque Rápido</span>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentAparelhos.length === 0 ? (
              <p style={{ color: '#B5AFA9', fontSize: 13, textAlign: 'center', padding: '12px 0', margin: 0 }}>
                Nenhum disponível
              </p>
            ) : (
              recentAparelhos.map((ap) => (
                <div key={ap.id} style={{ padding: 10, borderRadius: 12, background: '#FAF7F2', border: '1px solid #F0EBE3' }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: '#4A443F', margin: '0 0 2px' }}>
                    {ap.modelo} {ap.storage}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#9A948E' }}>{ap.cor}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#5D6D3E' }}>
                      {formatCurrency(ap.preco_venda)}
                    </span>
                  </div>
                  {ap.bateria_pct < 80 && (
                    <span style={{ fontSize: 11, color: '#D97706', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                      <Icon name="battery_alert" size={12} style={{ color: '#D97706' }} />
                      {ap.bateria_pct}%
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Icon name="calculate" size={16} style={{ color: '#5D6D3E' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#4A443F' }}>Descontos p/ Usado</span>
          </div>
          {[
            { condicao: 'Tela trocada', desconto: 25 },
            { condicao: 'Bateria abaixo de 80%', desconto: 15 },
            { condicao: 'Detalhes de uso visíveis', desconto: 10 },
            { condicao: 'Peça interna substituída', desconto: 20 },
          ].map((d) => (
            <div key={d.condicao} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#9A948E' }}>{d.condicao}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#DC2626' }}>–{d.desconto}%</span>
            </div>
          ))}
          <a href="/calculadora" style={{ display: 'block', marginTop: 8, textAlign: 'center', fontSize: 12, color: '#5D6D3E', fontWeight: 700, textDecoration: 'none' }}>
            Abrir Calculadora →
          </a>
        </div>
      </div>
    </div>
  )
}
