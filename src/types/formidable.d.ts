declare module 'formidable' {
  import type { IncomingMessage } from 'http'

  type File = {
    filepath: string
    originalFilename?: string
    mimetype?: string
    size?: number
  }

  type Fields = Record<string, string | string[]>
  type Files = Record<string, File | File[]>

  type Options = {
    multiples?: boolean
  }

  type Form = {
    parse(req: IncomingMessage, callback: (err: Error | null, fields: Fields, files: Files) => void): void
  }

  export default function formidable(options?: Options): Form
}
