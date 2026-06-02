import * as ImageManipulator from 'expo-image-manipulator'

/**
 * Compress and base64-encode an image URI for backend upload.
 * Shared by ReportScreen, ScanScreen, and SearchScreen.
 */
export async function compressAndEncode(uri) {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri, [{ resize: { width: 640 } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  )
  return { b64: manipulated.base64, mime: 'image/jpeg', preview: manipulated.uri }
}
