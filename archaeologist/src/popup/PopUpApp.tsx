import React from 'react'
import { useAsyncEffect } from 'use-async-effect'

import styled from '@emotion/styled'
import { PostHog } from 'posthog-js'

import { FromPopUp, ToPopUp } from './../message/types'
import { ViewActiveTabStatus } from './ViewActiveTabStatus'
import { ErrorBox, Spinner } from 'elementary'
import { productanalytics } from 'armoury'
import type { AnalyticsIdentity } from 'armoury'
import { PopUpContext } from './context'
import type {
  ForwardToRealImpl,
  StorageApiMsgPayload,
  StorageApiMsgReturnValue,
} from 'smuggler-api'
import { makeMsgProxyStorageApi } from 'smuggler-api'
import { renderUserFacingError } from './userFacingError'

const AppContainer = styled.div`
  width: 340px;
  height: 480px;
  font-family: 'Roboto', arial, sans-serif;
  font-style: normal;
  font-weight: 400;
`

const Centered = styled.div`
  margin: 0 auto 0 auto;
  display: flex;
  justify-content: center;
`

type State = null | {
  userUid?: string
  analytics?: PostHog
  error?: string
}

type Action =
  | ToPopUp.AppStatusResponse
  | ToPopUp.LogInResponse
  | { type: 'mark-as-errored'; error: string }

function updateState(state: State, action: Action): State {
  switch (action.type) {
    case 'APP_STATUS_RESPONSE': {
      const analytics = makeAnalytics(action.analyticsIdentity)
      return { userUid: action.userUid ?? undefined, analytics }
    }
    case 'RESPONSE_LOG_IN': {
      const analytics = makeAnalytics(action.analyticsIdentity)
      return {
        userUid: action.user.uid,
        analytics,
      }
    }
    case 'mark-as-errored': {
      return {
        error: action.error,
        userUid: state?.userUid,
        analytics: state?.analytics,
      }
    }
  }
}

function makeAnalytics(
  analyticsIdentity: AnalyticsIdentity
): PostHog | undefined {
  return (
    productanalytics.make('archaeologist/popup', process.env.NODE_ENV, {
      bootstrap: {
        distinctID: analyticsIdentity.analyticsIdentity,
        isIdentifiedID: true,
      },
    }) ?? undefined
  )
}

export const PopUpApp = () => {
  const [state, dispatch] = React.useReducer(updateState, null)

  useAsyncEffect(async () => {
    try {
      const response = await FromPopUp.sendMessage({
        type: 'REQUEST_APP_STATUS',
      })
      dispatch(response)
    } catch (e) {
      dispatch({
        type: 'mark-as-errored',
        error: renderUserFacingError({
          failedTo: 'detect its web extension',
          tryTo: 're-open this popup',
        }),
      })
    }
  }, [])

  const forwardToBackground: ForwardToRealImpl = async (
    payload: StorageApiMsgPayload
  ): Promise<StorageApiMsgReturnValue> => {
    const response = await FromPopUp.sendMessage({
      type: 'MSG_PROXY_STORAGE_ACCESS_REQUEST',
      payload,
    })
    return response.value
  }
  return (
    <AppContainer>
      <PopUpContext.Provider
        value={{
          storage: makeMsgProxyStorageApi(forwardToBackground),
          analytics: state?.analytics,
        }}
      >
        {determineWidget(state, dispatch)}
      </PopUpContext.Provider>
    </AppContainer>
  )
}

function determineWidget(state: State, _dispatch: React.Dispatch<Action>) {
  if (state == null) {
    return (
      <Centered>
        <Spinner.Wheel />
      </Centered>
    )
  }
  if (state.error != null) {
    return <ErrorBox>{state.error}</ErrorBox>
  }
  return <ViewActiveTabStatus />
}

export default PopUpApp
