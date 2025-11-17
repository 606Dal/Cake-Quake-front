import imageCompression from 'browser-image-compression';

export async function resizeImageUtile(file) {
  const options = {
    maxSizeMB: 2,                // 압축해서 2MB 이하로
    maxWidthOrHeight: 1500,      // 최대 해상도 제한
    useWebWorker: true           // 브라우저 백그라운드 처리
  }

  try {
    const compressedBlob = await imageCompression(file, options)

    // 원본 파일명 유지
    const compressedFile = new File(
      [compressedBlob],
      file.name,
      { type: file.type }
    )
    console.log("파일명 유지 확인: ", compressedFile)

    return compressedFile
    
  } catch (err) {
    console.error("Image resize error:", err)
    return file // 실패하면 원본 파일 그대로
  }
}