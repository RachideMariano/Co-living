import { eur, fmtDate } from './format'
import type { Tenant } from './api/tenants'
import type { Property } from './api/properties'

export type MessageTemplate = 'rent_reminder' | 'welcome' | 'inspection' | 'custom'

export function buildMessage(type: MessageTemplate, tenant: Tenant, property: Property | undefined, custom = ''): string {
  const first = tenant.name.split(' ')[0]
  const month = new Date().toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  switch (type) {
    case 'rent_reminder':
      return `Olá ${first}! 😊\n\nLembrete amigável: a renda de ${eur(tenant.rent)} referente a ${month} está pendente. Podes regularizar quando puderes?\n\nQualquer questão, é só dizer. Obrigado!`
    case 'welcome':
      return `Olá ${first}, bem-vindo(a)! 🏠\n\nEstamos muito contentes por te receber ${property ? `no ${property.name}` : ''}. Aqui ficam alguns pontos importantes:\n\n• Renda: ${eur(tenant.rent)}/mês, até ao dia 8\n• Zonas comuns: manter limpas após uso\n• Silêncio: 22h–8h\n• Qualquer avaria, avisa-nos logo\n\nBem-vindo(a) à casa! 😊`
    case 'inspection':
      return `Olá ${first}! 🔍\n\nVamos fazer a vistoria mensal ${property ? `do ${property.name}` : 'do apartamento'} nos próximos dias. É rápido (~15 min) e serve para verificar que está tudo bem.\n\nAlgum dia/hora que prefiras? Obrigado!`
    case 'custom':
    default:
      return custom
  }
}

export function landlordMessage(tenant: Tenant, property: Property): string {
  return `Exmo(a). Senhor(a) ${property.landlord_name || ''},\n\nVimos comunicar, nos termos do art. 1088.º do Código Civil, a celebração de contrato de subarrendamento no imóvel sito em ${property.address || property.name}.\n\nDados do ocupante:\n• Nome: ${tenant.name}\n• Data de início: ${fmtDate(tenant.move_in)}\n\nCom os melhores cumprimentos,`
}

export function whatsappUrl(contact: string | null | undefined, text: string): string | null {
  const num = (contact || '').replace(/[^0-9]/g, '')
  if (!num) return null
  return `https://wa.me/${num}?text=${encodeURIComponent(text)}`
}

export function mailtoUrl(contact: string | null | undefined, subject: string, body: string): string {
  const email = (contact || '').includes('@') ? contact! : ''
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
}
