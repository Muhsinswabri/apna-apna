// Sharing a generated file. The navigator is injectable so every outcome can be tested.

/** True when this browser can share `file` through the native share sheet. */
export function canShareFile(file, nav = globalThis.navigator) {
  try {
    return Boolean(nav && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [file] }))
  } catch {
    return false
  }
}

/**
 * Open the native share sheet with the file.
 * 'shared'      the browser reported the share finished
 * 'cancelled'   the user closed the share sheet
 * 'needs-tap'   the browser wants a fresh tap before it opens the sheet
 * 'unsupported' this browser cannot share files
 * 'failed'      anything else
 */
export async function shareFile(file, title, nav = globalThis.navigator) {
  if (!canShareFile(file, nav)) return 'unsupported'
  try {
    await nav.share({ files: [file], title })
    return 'shared'
  } catch (err) {
    if (err?.name === 'AbortError') return 'cancelled'
    if (err?.name === 'NotAllowedError') return 'needs-tap'
    return 'failed'
  }
}

/** Wrap the generated blob in a File (older browsers without the constructor get a named Blob). */
export function toFile(blob, name) {
  try {
    return new File([blob], name, { type: blob.type })
  } catch {
    return Object.assign(blob, { name })
  }
}
