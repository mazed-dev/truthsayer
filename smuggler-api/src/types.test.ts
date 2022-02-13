import { NodeExtattrs } from './types'
import { Mime } from 'armoury'

test('NodeExtattrs.fromJSON - full', async () => {
  const jsonStr = `{
    "content_type": "application/pdf",
    "title": "Node extra title",
    "description": "Node extra description",
    "lang": "en",
    "author": "Gaius Helen Mohiam",
    "web": {
      "url": "https://en.wikipedia.org/wiki"
    },
    "blob": {},
    "preview_image": {
      "content_type": "image/png",
      "data": "YWJj"
    }
  }`
  const nodeExtattrs = JSON.parse(jsonStr) as NodeExtattrs

  expect(nodeExtattrs.content_type).toStrictEqual(Mime.PDF)
  expect(nodeExtattrs.preview_image?.content_type).toStrictEqual(Mime.IMAGE_PNG)
  expect(nodeExtattrs.preview_image?.data).toStrictEqual('YWJj')
  expect(nodeExtattrs.title).toStrictEqual('Node extra title')
  expect(nodeExtattrs.description).toStrictEqual('Node extra description')
  expect(nodeExtattrs.lang).toStrictEqual('en')
  expect(nodeExtattrs.author).toStrictEqual('Gaius Helen Mohiam')
  expect(nodeExtattrs.web?.url).toStrictEqual('https://en.wikipedia.org/wiki')
  expect(nodeExtattrs.blob).not.toBeNull()
})

test('NodeExtattrs.fromJSON - mimimal', async () => {
  const jsonStr = `{
    "content_type": "application/pdf"
  }`
  const extattrs = JSON.parse(jsonStr) as NodeExtattrs

  expect(extattrs.content_type).toStrictEqual(Mime.PDF)
  expect(extattrs.preview_image).toBeFalsy()
  expect(extattrs.title).toBeFalsy()
  expect(extattrs.description).toBeFalsy()
  expect(extattrs.lang).toBeFalsy()
  expect(extattrs.author).toBeFalsy()
  expect(extattrs.web).toBeFalsy()
  expect(extattrs.blob).toBeFalsy()
})
