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
      content: 'Olá! Sou o TEKZ IA. Acesso em tempo real o estoque, calculo margens, pesquiso fornecedores (WPP) e ajudo a fechar vendas. O que precisa?',
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
            ? { ...m, content: 'Falha na conexão neural. Tente novamente em instantes.', timestamp: new Date() }
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
    <div className="fade flex flex-col lg:flex-row gap-6 h-[calc(100vh-100px)] min-h-[600px]">

      {/* Main Chat Area */}
      <div className="glass-panel flex-1 flex flex-col p-0 overflow-hidden border-white/5 relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex items-center gap-4 px-6 py-5 border-b border-white/5 bg-white/[0.01] z-10 shrink-0">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Icon name="smart_toy" size={24} className="text-teal-400" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">TEKZ Intelligence</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span className="text-xs text-teal-400 font-bold uppercase tracking-widest">Neural Net Online</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end animate-fade-in`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white/5 border border-white/10 text-teal-400'
                }`}>
                <Icon name={msg.role === 'user' ? 'person' : 'smart_toy'} size={20} />
              </div>
              <div className={`max-w-[80%] p-4 text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                  ? 'bg-indigo-500/20 border border-indigo-500/30 text-white rounded-2xl rounded-br-sm'
                  : 'bg-white/5 border border-white/10 text-zinc-300 rounded-2xl rounded-bl-sm backdrop-blur-md'
                }`}>
                {msg.content === '...' ? (
                  <div className="flex gap-1.5 items-center px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-teal-400/70 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                ) : (
                  <p dangerouslySetInnerHTML={{ __html: formatMarkdown(msg.content) }} className="m-0 font-sans" />
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="p-4 sm:p-6 border-t border-white/5 bg-white/[0.02] z-10 shrink-0">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => sendMessage(chip)}
                disabled={sending}
                className="whitespace-nowrap px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-bold hover:bg-white/10 hover:text-white hover:border-white/20 transition-all focus:outline-none"
              >
                {chip}
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite um comando para o assistente..."
              disabled={sending}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/50 transition-all font-sans placeholder-zinc-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="btn-primary px-5 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <Icon name="send" size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar Area */}
      <div className="w-full lg:w-72 flex flex-col gap-6 shrink-0 z-10">

        <div className="glass-panel p-0 border-white/5 overflow-hidden">
          <div className="flex items-center gap-3 p-4 border-b border-white/5 bg-white/[0.02]">
            <Icon name="bolt" size={18} className="text-amber-400" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Estoque Rápido</span>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {recentAparelhos.length === 0 ? (
              <p className="text-zinc-500 text-xs text-center py-4 font-bold">Nenhum disponível</p>
            ) : (
              recentAparelhos.map((ap) => (
                <div key={ap.id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                  <p className="font-bold text-sm text-white mb-1">{ap.modelo} {ap.storage}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{ap.cor}</span>
                    <span className="font-bold text-teal-400">{formatCurrency(ap.preco_venda)}</span>
                  </div>
                  {ap.bateria_pct < 80 && (
                    <span className="text-[10px] text-amber-500 flex items-center gap-1.5 mt-2 font-bold uppercase tracking-widest">
                      <Icon name="battery_alert" size={12} /> Bateria: {ap.bateria_pct}%
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-panel p-5 border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Icon name="price_change" size={18} className="text-indigo-400" />
            <span className="text-sm font-bold text-white uppercase tracking-widest">Avaliação Média</span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { condicao: 'Tela trocada', desconto: 25 },
              { condicao: 'Bateria < 80%', desconto: 15 },
              { condicao: 'Marcas de Uso', desconto: 10 },
              { condicao: 'Peça Paralela', desconto: 20 },
            ].map((d) => (
              <div key={d.condicao} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className="text-zinc-400 font-medium">{d.condicao}</span>
                <span className="font-bold text-red-400">-{d.desconto}%</span>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/calculadora')} className="w-full mt-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500 hover:text-white transition-all text-center">
            Abrir Calculadora →
          </button>
        </div>

      </div>

    </div>
  )
}
