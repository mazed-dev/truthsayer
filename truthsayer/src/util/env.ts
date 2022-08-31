import { MimeType } from 'armoury'

export function getLogoImage(
  type?: MimeType.IMAGE_PNG | MimeType.IMAGE_SVG_XML,
  size?: '128' | '72' | '48'
): string {
  switch (process.env.NODE_ENV) {
    case 'development': {
      if (type === MimeType.IMAGE_PNG) {
        return process.env.PUBLIC_URL + '/logo-dev-72x72.svg'
      } else {
        return process.env.PUBLIC_URL + '/logo-dev-strip.svg'
      }
    }
  }
  if (type === MimeType.IMAGE_SVG_XML) {
    return process.env.PUBLIC_URL + '/logo-strip.svg'
  } else {
    size = size ?? '128'
    return process.env.PUBLIC_URL + `/logo-${size}x${size}.png`
  }
}
