import { Helmet } from 'react-helmet'

import { getLogoImage } from './util/env'
import { MimeType } from 'armoury'

export const kDescription =
  "AI-powered second brain enabling you to retain everything you read, automatically, and to link anything you've seen, without searching for it."

/**
 *
 */
export function AppHead() {
  return (
    <Helmet defer>
      <title>Foreword</title>
      <meta name="description" content={kDescription} />

      <meta property="og:title" content="Foreword" />
      <meta property="og:type" content="website" />
      <meta property="og:description" content={kDescription} />

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
      {/* For all google fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/*
        Font to style Foreword logo and promo materials, such as landing page.
        Add following CSS property to use the font:
          font-family: 'Comfortaa';font-size: 22px;
        See https://fonts.google.com/specimen/Comfortaa for more info
      */}
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Serif"
        rel="stylesheet"
      />
      {/* Font to style all other texts */}
      <link
        href="https://fonts.googleapis.com/css?family=Roboto"
        rel="stylesheet"
      />
      {/*
          Font for imporovised preview images for bookmarks where we failed to
          extract some real image from the page.
      */}
      <link
        href="https://fonts.googleapis.com/css?family=Comfortaa"
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
