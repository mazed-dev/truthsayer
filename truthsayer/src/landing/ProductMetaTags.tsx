import { Helmet } from 'react-helmet'

import { getLogoImage } from './../util/env'
import { MimeType } from 'armoury'

export const kMazedDescription =
  'Quick access to everything you encounter online'

/**
 *
 */
export function ProductMetaTags() {
  return (
    <Helmet>
      <title>Mazed</title>
      <meta name="description" content={kMazedDescription} />

      <meta property="og:title" content="Mazed" />
      <meta property="og:type" content="website" />
      <meta property="og:description" content={kMazedDescription} />

      <link
        rel="icon"
        type="image/svg+xml"
        href={getLogoImage(MimeType.IMAGE_SVG_XML)}
      />
      <link
        rel="apple-touch-icon"
        href={getLogoImage(MimeType.IMAGE_PNG, '128')}
      />
      <link
        rel="alternate icon"
        type="image/png"
        href={getLogoImage(MimeType.IMAGE_PNG, '72')}
      />
    </Helmet>
  )
}
