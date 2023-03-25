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
        This temporary browser window is used by Mazed to import your browser
        history. It will open & close tabs with the pages you visited in the
        past, to extract their data exactly as you saw them.
      </Box>
      <Box>
        <Spinner.Ring /> {progress.processed} of {progress.total} webpages
        processed.
      </Box>
      <Box>This window will close automatically.</Box>
    </>
  )
}
