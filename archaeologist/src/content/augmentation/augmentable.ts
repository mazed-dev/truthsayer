const kPageWriteAugmentableBlocklist: RegExp[] = [
  // Note [akindyakov@]: Write augmentation disrupts user workflow in
  // spreadsheets badly, it has to be fixed before allowing it if needed at all.
  /google\.com\/spreadsheets\//, // Google Sheets
  /sharepoint\.com\//, // Microsoft Excel Online
]

export function isPageWriteAugmentable(url: string): boolean {
  if (kPageWriteAugmentableBlocklist.find((r: RegExp) => url.match(r))) {
    return false
  }
  return true
}
