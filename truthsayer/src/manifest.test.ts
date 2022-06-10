/**
 * Verify fields of public manifest.json file
 */

import { Mime } from 'armoury'
import fs from 'fs'

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

test('manifest tests', async () => {
  // @ts-ignore: public/manifest.json' is not under 'rootDir' 'truthsayer/truthsayer/src'.
  // 'rootDir' is expected to contain all source files
  const manifest = await import('../public/manifest.json')
  verifyManifestLogo(manifest.default['icons'])
})
