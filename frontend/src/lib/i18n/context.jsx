import { createContext, useContext, useState, useCallback } from 'react'
import en from './en.json'
import ja from './ja.json'
import hi from './hi.json'

const LANG_KEY = 'crowd-lang'
const FALLBACK = 'en'

const ALL = { en, ja, hi }

function getInitial() {
  try { return localStorage.getItem(LANG_KEY) || FALLBACK }
  catch { return FALLBACK }
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(getInitial)
  const strings = ALL[lang] || ALL[FALLBACK]

  const setLang = useCallback((next) => {
    setLangState(next)
    try { localStorage.setItem(LANG_KEY, next) } catch {}
  }, [])

  const t = useCallback((key, vars) => {
    let val = strings[key]
    if (val == null) return key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        val = val.replace(`{${k}}`, v)
      })
    }
    return val
  }, [strings])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function useT() {
  const { t } = useI18n()
  return t
}
