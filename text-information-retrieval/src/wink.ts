// Load wink-nlp package.
import winkNLP, { WinkMethods, Document as WinkDocument } from 'wink-nlp'
// Load english language model.
import model from 'wink-eng-lite-web-model'

export type { WinkMethods, Document as WinkDocument } from 'wink-nlp'

export function loadModel(): WinkMethods {
  // Instantiate winkNLP model
  return winkNLP(model)
}
