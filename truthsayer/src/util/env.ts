import { MimeType } from 'armoury'

export function getLogoImage(
  type?: MimeType.IMAGE_PNG | MimeType.IMAGE_SVG_XML,
  size?: '128' | '72' | '16'
): string {
  if (type === MimeType.IMAGE_SVG_XML) {
    return process.env.PUBLIC_URL + '/logo-strip.svg'
  }
  size = size ?? '128'
  return process.env.PUBLIC_URL + `/logo-${size}x${size}.png`
}
