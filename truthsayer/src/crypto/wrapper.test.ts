import {
  decrypt,
  decryptSignedObject,
  encrypt,
  encryptAndSignObject,
  genSecretPhrase,
  makeSecret,
  sha1,
  sign,
} from './wrapper'

// OpenSSL compatible:
// openssl enc -aes-256-cbc -d -pass pass:"passphrase" -base64 -md md5 -in encrypted
// https://wiki.archlinux.org/index.php/OpenSSL#.22bad_decrypt.22_while_decrypting

test('simple enc & dec', () => {
  const inputText = 'Hello World'
  const passphrase = 'passphrase'

  const encryptedBase64 = encrypt(inputText, passphrase)
  const decryptedText = decrypt(encryptedBase64, passphrase)

  expect(decryptedText).toStrictEqual(inputText)
})

test('sha1 consistency', async () => {
  const inputText = 'https://cryptojs.gitbook.io/docs/'
  const hashValue = await sha1(inputText)
  // echo -n '<inputText>' | openssl dgst -binary -sha1 | openssl base64
  expect(hashValue).toStrictEqual('v2O1LAW2KVO98y97uCiWR2gzQAQ=')
})

test('sign output', async () => {
  const inputText = 'https://cryptojs.gitbook.io/docs/'
  const passphrase = 'a/study/in/scarlet'
  const signed = await sign(inputText, passphrase)
  expect(signed).toStrictEqual('Nb92J70G718pEsRDAaMWEfv3AxWHBSXNoWckfuW+RGE=')
})

test('encryptAndSignObject & decryptSignedObject', async () => {
  const inputObject = {
    size: 5381,
    fill: ['abc', -1],
    encoding: 'utf8',
  }
  const secretPhrase = '&#0; NUL Null 001 &#1; SOH Start of Header 010 &#2'

  const secret: TSecret = makeSecret(secretPhrase)

  const encrypted = await encryptAndSignObject(inputObject, secret)
  expect(encrypted.secret_id).toStrictEqual(secret.id)

  const decryptedObject = await decryptSignedObject(encrypted, secret)
  expect(decryptedObject).toStrictEqual(inputObject)
})

test('makeSecret & genSecretPhrase compatibility', () => {
  const secretPhrase =
    '0@Pp(2FPZdnx!1AQaq)3=GQ[eoy2BRbr*4>HRfpz################################' +
    '#3CScs!+5?IS]gq{$4DTdt,6@JT^hr|%5EUeu#-7AKU_is})9IYiy&&&&&&&&&&&&&&&&&&&' +
    '&6FVfv$.8BLVjt~7GWgw%/9CMWakuDEL(8HXhx&0:DNXblv1;EOYcmw.................'
  const secret = makeSecret(secretPhrase)
  const phrase = genSecretPhrase(secret)
  expect(phrase).toStrictEqual(secretPhrase)
})

test('makeSecret & genSecretPhrase compatibility (short)', () => {
  const secretPhrase = 'aq)3=GQ'
  const secret = makeSecret(secretPhrase)
  const phrase = genSecretPhrase(secret)
  expect(phrase).toStrictEqual(secretPhrase)
})
