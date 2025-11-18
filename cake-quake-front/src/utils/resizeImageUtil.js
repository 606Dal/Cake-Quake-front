import imageCompression from 'browser-image-compression';

// 파일 해상도 읽기
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

// 이미지 리사이즈
export async function resizeImageUtile(file) {
  const options = {
    maxSizeMB: 2,                // 압축해서 2MB 이하로
    maxWidthOrHeight: 1500,      // 최대 해상도 제한
    useWebWorker: true           // 브라우저 백그라운드 처리
  }

  try {
    // 원본 해상도 먼저 체크
    // const originalDim = await getImageDimensions(file)
    // console.log(
    //   `[원본] ${file.name} - size: ${(file.size / 1024 / 1024).toFixed(2)}MB, [해상도] ${originalDim.width} x ${originalDim.height}`
    // )

    const compressedBlob = await imageCompression(file, options)

    // 원본 파일명 유지
    const compressedFile = new File(
      [compressedBlob],
      file.name,
      { type: file.type }
    )

    // 리사이즈 후 크기/해상도 체크
    // const resizedDim = await getImageDimensions(compressedFile)
    // console.log(
    //   `[리사이즈 후] ${compressedFile.name} - size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB, [해상도] ${resizedDim.width} x ${resizedDim.height}`
    // )

    return compressedFile

  } catch (err) {
    console.error("Image resize error:", err)
    return file // 실패하면 원본 파일 그대로
  }
}