import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import {
  Camera,
  FileAudio,
  Image,
  Paperclip,
  Send,
  Video,
  X,
} from 'lucide-react'

interface MessageComposerProps {
  disabled?: boolean
  placeholder?: string
  sending?: boolean
  onSend: (body: string) => Promise<void> | void
  onSendMedia?: (file: File, caption: string) => Promise<void> | void
}

export function MessageComposer({
  disabled,
  placeholder = 'Message…',
  sending,
  onSend,
  onSendMedia,
}: MessageComposerProps) {
  const [value, setValue] = useState('')
  const [attachment, setAttachment] = useState<File | null>(null)
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const imageRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!attachment) {
      setAttachmentUrl('')
      return
    }
    const url = URL.createObjectURL(attachment)
    setAttachmentUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [attachment])

  async function submit() {
    const body = value.trim()
    if (disabled || sending || (!body && !attachment)) return

    if (attachment) {
      if (!onSendMedia) return
      try {
        await onSendMedia(attachment, body)
        setAttachment(null)
        setValue('')
      } catch {
        // Keep attachment selected so the user can retry after upload support.
      }
      return
    }

    try {
      await onSend(body)
      setValue('')
    } catch {
      // Keep draft on send failure.
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void submit()
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  function selectFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setAttachment(file)
    e.target.value = ''
    setMenuOpen(false)
  }

  function fileSize(bytes: number) {
    if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative pl-4 pr-24 py-3 border-t border-border-subtle bg-surface-raised/80"
    >
      <input
        ref={imageRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={selectFile}
      />
      <input
        ref={videoRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={selectFile}
      />
      <input
        ref={audioRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={selectFile}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        className="hidden"
        onChange={selectFile}
      />

      {attachment && (
        <div className="mb-2 rounded-xl border border-border-subtle bg-surface-overlay p-2 flex items-center gap-3">
          <div className="w-14 h-14 rounded-lg bg-surface overflow-hidden shrink-0 flex items-center justify-center">
            {attachment.type.startsWith('image/') && attachmentUrl ? (
              <img
                src={attachmentUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : attachment.type.startsWith('video/') ? (
              <Video className="w-5 h-5 text-accent" />
            ) : (
              <FileAudio className="w-5 h-5 text-accent" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">
              {attachment.name}
            </p>
            <p className="text-[10px] text-slate-500">
              {fileSize(attachment.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAttachment(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface cursor-pointer"
            aria-label="Remove attachment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="absolute bottom-[5.25rem] left-4 z-30 w-48 rounded-xl border border-border bg-surface-raised shadow-xl p-1.5 animate-fade-in">
          {[
            {
              label: 'Gallery / image',
              icon: Image,
              action: () => imageRef.current?.click(),
            },
            {
              label: 'Video',
              icon: Video,
              action: () => videoRef.current?.click(),
            },
            {
              label: 'Music / audio',
              icon: FileAudio,
              action: () => audioRef.current?.click(),
            },
            {
              label: 'Open camera',
              icon: Camera,
              action: () => cameraRef.current?.click(),
            },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-surface-overlay cursor-pointer"
            >
              <item.icon className="w-4 h-4 text-accent" />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-2xl bg-surface-overlay border border-border-subtle px-3 py-2 focus-within:border-accent/40 transition-colors">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setMenuOpen((open) => !open)}
          className={`p-2 rounded-xl shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${
            menuOpen
              ? 'bg-accent/15 text-accent'
              : 'text-slate-400 hover:text-white hover:bg-surface'
          }`}
          title="Attach media"
          aria-label="Attach media"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={placeholder}
          className="flex-1 resize-none bg-transparent text-sm text-white placeholder:text-slate-500 outline-none max-h-32 py-1.5"
        />
        <button
          type="submit"
          disabled={disabled || sending || (!value.trim() && !attachment)}
          className="p-2 rounded-xl bg-accent text-white disabled:opacity-40 hover:bg-accent-hover transition-colors cursor-pointer shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-[10px] text-slate-600 mt-1.5 px-1">
        Enter to send · Shift+Enter for new line
      </p>
    </form>
  )
}
