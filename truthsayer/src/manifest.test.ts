/**
 * Verify fields of public manifest.json file
 */

import { Mime } from 'armoury'
import fs from 'fs'

export {}

type IconType = {
  src: string
  type: string
  sizes?: string
  purpose?: string
}

function verifyManifestLogo(icons: IconType[]) {
  icons.forEach((icon: IconType) => {
    const mime = Mime.fromString(icon.type)
    expect(Mime.isImage(mime!)).toStrictEqual(true)
    expect(fs.existsSync(`./public/${icon.src}`)).toStrictEqual(true)
  })
}

test('manifest tests', () => {
  const manifest = require('../public/manifest.json')
  verifyManifestLogo(manifest['icons'])
})
