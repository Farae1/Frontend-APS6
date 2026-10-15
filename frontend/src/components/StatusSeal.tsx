// The big circle with a check (or an X) that draws itself.

export default function StatusSeal({ success }: { success: boolean }) {
  return (
    <div className="seal" aria-hidden>
      <svg viewBox="0 0 52 52">
        <circle cx="26" cy="26" r="24" />
        <path d={success ? 'M16 27l7 7 13-15' : 'M18 18l16 16M34 18L18 34'} />
      </svg>
    </div>
  )
}
