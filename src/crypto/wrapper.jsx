import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import Pkcs7 from "crypto-js/pad-pkcs7";
import HmacSHA256 from "crypto-js/hmac-sha256";

const shajs = require("sha.js");

export const encrypt = (text: string, passphrase: string): string => {
  const encrypted = AES.encrypt(text, passphrase, {
    // default mode CBC,
    padding: Pkcs7,
  });
  return encrypted.toString();
};

export const decrypt = (ciphertext: string, passphrase: string): string => {
  const bytes = AES.decrypt(ciphertext, passphrase);
  const originalText: string = bytes.toString(Utf8);
  return originalText;
};

export const sha1 = (str: string): string => {
  return shajs("sha1").update(str).digest("hex");
};

export const sign = (data: string, passphrase: string): string => {
  HmacSHA256(data, passphrase);
}

export const verify = (signature: string, data: string, passphrase: string): bool => {
  return signature === sign(data, passphrase);
}
