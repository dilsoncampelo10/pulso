/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_URL?: string
  readonly VITE_CONTACT_EMAIL?: string
  readonly VITE_ADSENSE_CLIENT?: string
  readonly VITE_ADSENSE_SLOT_MENU?: string
  readonly VITE_ADSENSE_SLOT_RESULTS?: string
  readonly VITE_ADSENSE_SLOT_SIDE?: string
  readonly VITE_ADS_PREVIEW?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
