type Tone = 'green' | 'red' | 'amber' | 'blue' | 'gray'

const tones: Record<Tone, string> = {
  green: 'bg-[rgba(48,209,88,.16)] text-[#1f8f43]',
  red: 'bg-[rgba(255,69,58,.13)] text-[#d0342b]',
  amber: 'bg-[rgba(255,159,10,.16)] text-[#b06c00]',
  blue: 'bg-[rgba(10,132,255,.13)] text-[#0865c4]',
  gray: 'bg-[rgba(120,120,128,.14)] text-[#5b5b61]',
}

export default function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold px-2.5 py-1 rounded-full ${tones[tone]}`}>{children}</span>
}
