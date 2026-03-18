import crypto from 'node:crypto'

export const createId = (): string => crypto.randomUUID()

