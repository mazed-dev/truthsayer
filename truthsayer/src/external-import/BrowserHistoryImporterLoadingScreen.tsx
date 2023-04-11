import styled from '@emotion/styled'

import { BackgroundActionProgress } from 'truthsayer-archaeologist-communication'

import { Spinner } from 'elementary'

const Box = styled.div`
  padding: 18px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 18px;
`

const BigBox = styled.div`
  padding: 18px;

  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 30px;
`

export function BrowserHistoryImporterLoadingScreen({
  progress,
}: {
  progress: BackgroundActionProgress
}) {
  return (
    <>
      <BigBox>🧘</BigBox>
      <Box>
        This temporary browser window is used by Mazed to save your browser
        history to your personal Mazed account. To do so, it will open & close
        tabs with the pages you visited in the past.
      </Box>
      <Box>
        <span>
          As a reminder, this information is stored locally on your device,
          protecting your privacy. It will not take up any significant amount of
          storage. For more information on how we protect your privacy, you can
          read our <a href="/privacy-policy">privacy policy</a> here.
        </span>
      </Box>
      <Box>
        <Spinner.Ring /> {progress.processed} of {progress.total} webpages
        processed.
      </Box>
      <Box>This window will close automatically.</Box>
    </>
  )
}
