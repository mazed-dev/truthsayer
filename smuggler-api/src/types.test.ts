import { NodeExtattrs } from './types'
import { MimeType } from './util/mime'

test('NodeExtattrs.fromJSON - full', async () => {
  const jsonStr = `{
    "content_type": "application/pdf",
    "preview_image": {
      "content_type": "image/png",
      "data": "YWJj"
    }
  }`
  const nodeExtattrs = NodeExtattrs.fromJSON(JSON.parse(jsonStr))

  expect(nodeExtattrs.content_type).toStrictEqual(MimeType.PDF)
  expect(nodeExtattrs.preview_image?.content_type).toStrictEqual(
    MimeType.IMAGE_PNG
  )
  expect(nodeExtattrs.preview_image?.data).toStrictEqual('YWJj')
})

test('NodeExtattrs.fromJSON - mimimal', async () => {
  const jsonStr = `{
    "content_type": "application/pdf"
  }`
  const nodeExtattrs = NodeExtattrs.fromJSON(JSON.parse(jsonStr))

  expect(nodeExtattrs.content_type).toStrictEqual(MimeType.PDF)
  expect(nodeExtattrs.preview_image).toStrictEqual(null)
})
