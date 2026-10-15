import { Gear } from './Icons'

/** The gear in the top right corner: approvals and the base minister's access. */
export default function SettingsButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="settings-button" onClick={onClick} aria-label={label} title={label}>
      <Gear size={26} />
    </button>
  )
}
