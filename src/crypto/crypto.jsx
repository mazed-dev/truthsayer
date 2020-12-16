import AES from "crypto-js/aes";
import Utf8 from "crypto-js/enc-utf8";
import Pkcs7 from "crypto-js/pad-pkcs7";

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
