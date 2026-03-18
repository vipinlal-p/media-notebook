import fs from 'node:fs'

import type { VaultStatus } from '../../../shared/contracts'

import { createVerifier, deriveKey, vaultIterations } from '../utils/crypto'
import type { AppPaths } from './paths'

interface VaultSettings {
  initializedAt: string
  salt: string
  verifier: string
  iterations: number
}

export class SettingsService {
  public constructor(private readonly appPaths: AppPaths) {}

  public getSettings(): VaultSettings | null {
    if (!fs.existsSync(this.appPaths.settingsPath)) {
      return null
    }
    const raw = fs.readFileSync(this.appPaths.settingsPath, 'utf8')
    return JSON.parse(raw) as VaultSettings
  }

  public saveSettings(settings: VaultSettings): void {
    fs.writeFileSync(this.appPaths.settingsPath, JSON.stringify(settings, null, 2), 'utf8')
  }

  public async verifyPassword(password: string): Promise<Buffer | null> {
    const settings = this.getSettings()
    if (!settings) {
      return null
    }
    const key = await deriveKey(password, settings.salt)
    return createVerifier(key) === settings.verifier ? key : null
  }

  public getStatus(unlocked: boolean, mediaCount: number): VaultStatus {
    const initialized = this.getSettings() !== null
    return {
      initialized,
      unlocked,
      libraryPath: this.appPaths.root,
      mediaCount,
    }
  }

  public createVaultConfig(salt: string, verifier: string): VaultSettings {
    return {
      initializedAt: new Date().toISOString(),
      salt,
      verifier,
      iterations: vaultIterations,
    }
  }
}

