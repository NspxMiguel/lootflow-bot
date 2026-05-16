declare module 'qrcode-terminal' {
  function generate(text: string, opts?: { small?: boolean }, callback?: () => void): void
  export = { generate }
}
