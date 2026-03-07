export type UserRole = 'vendedor' | 'admin'

export interface Profile {
  id: string
  nome: string
  role: UserRole
  ativo: boolean
  created_at: string
}

export type AparelhoStatus = 'Disponível' | 'Reservado' | 'Vendido' | 'Na Oficina'

export interface Aparelho {
  id: string
  modelo: string
  storage: string
  cor: string
  imei: string
  bateria_pct: number
  preco_compra: number
  preco_venda: number
  status: AparelhoStatus
  vendedor_id: string | null
  data_entrada: string
  data_venda: string | null
  created_at: string
}

export type OSStatus = 'Aguardando Peça' | 'Em Andamento' | 'Pronto' | 'Entregue'

export interface OrdemServico {
  id: string
  cliente_nome: string
  cliente_tel: string
  modelo: string
  problema: string
  tecnico: string
  status: OSStatus
  valor: number | null
  data_entrada: string
  data_previsao: string | null
  data_entrega: string | null
  vendedor_id: string | null
  created_at: string
}

export interface Venda {
  id: string
  aparelho_id: string | null
  vendedor_id: string
  preco_venda: number
  preco_compra: number
  forma_pagamento: 'pix' | 'cartao'
  parcelas: number
  comissao_pct: number
  lucro_liquido: number
  created_at: string
}

export interface Mensagem {
  id: string
  loja: string
  mensagem: string
  grupo: string
  data_hora: string
  created_at: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
