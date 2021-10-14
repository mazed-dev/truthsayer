export interface TDownloadedFile {
  success: boolean;
}

export async function downloadAsFile(filename, text): TDownloadedFile {
  const element = document.createElement('a')
  element.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`
  )
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)

  element.click()

  document.body.removeChild(element)

  return {
    success: true,
  }
}
