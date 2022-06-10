import isUrl from 'is-url'

import { Editor, Transforms } from 'slate'

import * as imageExtensions from 'image-extensions'

import { kSlateBlockTypeImage, ImageElement, CustomEditor } from '../types.js'

export const withImages = (editor: CustomEditor) => {
  const { insertData, isVoid } = editor

  editor.isVoid = (element) => {
    return element.type === kSlateBlockTypeImage ? true : isVoid(element)
  }

  editor.insertData = (data) => {
    const text = data.getData('text/plain')
    const { files } = data

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader()
        const [mime] = file.type.split('/')

        if (mime === 'image') {
          reader.addEventListener('load', () => {
            const url = reader.result
            insertImage(editor as Editor, url as string)
          })

          reader.readAsDataURL(file)
        }
      }
    } else if (isImageUrl(text)) {
      insertImage(editor as Editor, text)
    } else {
      insertData(data)
    }
  }

  return editor
}

const insertImage = (editor: Editor, url: string) => {
  const text = { text: '' }
  const image: ImageElement = {
    type: kSlateBlockTypeImage,
    url,
    children: [text],
  }
  Transforms.insertNodes(editor, image)
}

const isImageUrl = (url?: string) => {
  if (!url) return false
  if (!isUrl(url)) return false
  const ext = new URL(url).pathname.split('.').pop()
  if (!ext) return false
  return imageExtensions.includes(ext)
}
