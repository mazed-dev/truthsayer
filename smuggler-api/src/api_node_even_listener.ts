import type { Nid } from './types'
import type {
  NodeEventListener,
  NodeEventPatch,
  NodeEventType,
} from './storage_api'

export namespace NodeEvent {
  const _listeners: NodeEventListener[] = []

  export function addListener(listener: NodeEventListener): void {
    _listeners.push(listener)
  }
  export function removeListener(listener: NodeEventListener): void {
    const index = _listeners.findIndex((l) => l === listener)
    if (index < 0) {
      throw new Error(
        'Attempt to remove non existin node even listener from storage API'
      )
    }
    _listeners.splice(index, 1)
  }
  export const registerEvent: NodeEventListener = async (
    type: NodeEventType,
    nid: Nid,
    patch: NodeEventPatch
  ) => {
    for (const listener of _listeners) {
      listener(type, nid, patch)
    }
  }
}
