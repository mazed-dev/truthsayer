import { ToTruthsayer } from 'truthsayer-archaeologist-communication'

export type ArchaeologistState =
  | {
      state: 'installed'
      version: ToTruthsayer.ArchaeologistVersion
    }
  | { state: 'loading' }
  | { state: 'not-installed' }
