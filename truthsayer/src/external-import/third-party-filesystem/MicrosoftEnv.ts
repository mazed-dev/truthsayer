/**
 * Microsoft REST resources, specific to a particular Microsoft Azure environment.
 * Resources from different environments should never be mixed, this leads
 * to obscure errors.
 *
 * At the time of this writing only "production" MS environment is useful to the
 * project, so this could have been a single const instead of a type with
 * multiple implementations. However the amount of effort wasted to discover the
 * correct combination of resources has motivated to leave at least a mention of
 * different environments in here, even if only one is used in practice.
 *
 * Attempts to find any official description of how MS environments differ have
 * failed. Current implementations of this type were a result of
 * digging through various official docs, tutorials, StackOverflow questions etc.
 */
export type MsEnvironment = {
  /** Authentication and authorisation resource */
  authority: string
  /**
   * Common prefix for all Microsoft Graph endpoints. See 'MsGraphEndpoint' for
   * more details
   */
  graph: string
}

export const MsPreproductionEnv: MsEnvironment = {
  authority: 'https://login.windows-ppe.net/common',
  graph: 'https://graph.microsoft-ppe.com/v1.0',
}

export const MsProductionEnv: MsEnvironment = {
  authority: 'https://login.microsoftonline.com/common',
  graph: 'https://graph.microsoft.com/v1.0',
}
