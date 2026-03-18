import log from 'electron-log/main'

log.initialize()
log.transports.file.level = 'info'

export const logger = log

