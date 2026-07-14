import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastCtx = createContext<(msg: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('')
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const toast = useCallback((m: string) => {
    setMsg(m)
    setShow(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setShow(false), 2200)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div
        className={`fixed bottom-7 left-1/2 -translate-x-1/2 z-[300] rounded-full px-6 py-3 text-[13.5px] font-semibold text-white bg-[rgba(28,28,30,.85)] backdrop-blur-xl border border-white/10 shadow-lg transition-all duration-300 pointer-events-none ${
          show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        {msg}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
