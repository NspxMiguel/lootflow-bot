import 'dotenv/config'

function required(name: string): string {
  const val = process.env[name]
  if (!val) throw new Error(`Variável de ambiente obrigatória: ${name}`)
  return val
}

export const config = {
  firebase: {
    projectId: required('FIREBASE_PROJECT_ID'),
    clientEmail: required('FIREBASE_CLIENT_EMAIL'),
    privateKey: required('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  },
  whatsapp: {
    sessionPath: process.env.WHATSAPP_SESSION_PATH ?? './session',
  },
  tzOffset: parseInt(process.env.TZ_OFFSET ?? '-3', 10),
}
