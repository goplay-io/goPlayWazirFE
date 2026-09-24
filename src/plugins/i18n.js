import { createI18n } from 'vue-i18n'
import en from '../locales/en.json'
import hi from '../locales/hi.json'
import ml from '../locales/ml.json'
import te from '../locales/te.json'
import ta from '../locales/ta.json'
import as from '../locales/as.json'
import bn from '../locales/bn.json'
import gu from '../locales/gu.json'
import kn from '../locales/kn.json'
import mr from '../locales/mr.json'
import or from '../locales/or.json'
import pa from '../locales/pa.json'

const savedLocale = (typeof window !== 'undefined' && localStorage.getItem('locale')) || 'en'

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    hi,
    ml,
    te,
    ta,
    as,
    bn,
    gu,
    kn,
    mr,
    or,
    pa
  }
})

export default i18n
