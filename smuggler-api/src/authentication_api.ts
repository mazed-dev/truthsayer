import { Ack, AccountInfo } from './types'

export type SessionCreateArgs = {
  email: string
  password: string
  permissions: number | null
}

export type AuthenticationApi = {
  getAuth: ({ signal }: { signal?: AbortSignal }) => Promise<AccountInfo>
  session: {
    create: (args: SessionCreateArgs, signal?: AbortSignal) => Promise<{}>
    delete: ({ signal }: { signal: AbortSignal }) => Promise<Ack>
    update: (signal?: AbortSignal) => Promise<Ack>
  }
  user: {
    password: {
      recover: ({
        email,
        signal,
      }: {
        email: string
        signal: AbortSignal
      }) => Promise<Ack>
      reset: ({
        token,
        new_password,
        signal,
      }: {
        token: string
        new_password: string
        signal: AbortSignal
      }) => Promise<Ack>
      change: (
        old_password: string,
        new_password: string,
        signal?: AbortSignal
      ) => Promise<Ack>
    }
    register: ({
      name,
      email,
      signal,
    }: {
      name: string
      email: string
      signal?: AbortSignal
    }) => Promise<Ack>
  }
}
