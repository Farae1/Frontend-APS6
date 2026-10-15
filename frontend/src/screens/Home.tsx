import { useEffect } from 'react'
import { FaceScan, Leaf } from '../components/Icons'
import SettingsButton from '../components/SettingsButton'
import { preloadFaceDetector } from '../face'

interface Props {
  onLogin: () => void
  onRegister: () => void
  /** The gear: the base minister's access. */
  onSettings: () => void
}

/** The start screen: sign in with the face, or register. */
export default function Home({ onLogin, onRegister, onSettings }: Props) {
  // Start loading the face model now, so "Começar" is ready sooner.
  useEffect(() => {
    preloadFaceDetector().catch(() => {})
  }, [])

  return (
    <main className="panel home">
      <SettingsButton onClick={onSettings} label="Acesso do ministro base" />
      <div className="home__brand">
        <span className="home__badge">
          <Leaf size={34} />
        </span>
        <p className="home__agency">Ministério do Meio Ambiente</p>
      </div>

      <div className="home__body">
        <FaceScan size={56} />
        <h1>Acesso por biometria facial</h1>
        <p>Entre com o seu rosto: sem senha, em poucos segundos.</p>
      </div>

      <div className="actions">
        <button className="button" onClick={onLogin}>
          Entrar
        </button>
        <button className="button button--outline" onClick={onRegister}>
          Registrar
        </button>
      </div>
    </main>
  )
}
