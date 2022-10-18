import { Helmet } from 'react-helmet'

import { getLogoImage } from './util/env'
import { MimeType } from 'armoury'

export const kMazedDescription =
  'Quick access to everything you encounter online'

/**
 *
 */
export function AppHead() {
  return (
    <Helmet defer>
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
      <link
        rel="alternate icon"
        type="image/png"
        href={getLogoImage(MimeType.IMAGE_PNG, '16')}
      />
      {/*
        Font to style Mazed logo and promo materials, such as landing page.
        Add following CSS property to use the font:
          font-family: 'Comfortaa';font-size: 22px;
        See https://fonts.google.com/specimen/Comfortaa for more info
      */}
      <link
        href="https://fonts.googleapis.com/css?family=Comfortaa"
        rel="stylesheet"
      />
      {/* Font to style all other texts */}
      <link
        href="https://fonts.googleapis.com/css?family=Roboto"
        rel="stylesheet"
      />
      {/*
         Can be enabled for an element via applying a 'material-icons' css class
        See https://google.github.io/material-design-icons/ for more info
      */}
      <link
        href="https://fonts.googleapis.com/icon?family=Material+Icons"
        rel="stylesheet"
      />
      <meta
        name="viewport"
        content="user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1"
      />
      <meta name="theme-color" content="#000000" />
    </Helmet>
  )
}
