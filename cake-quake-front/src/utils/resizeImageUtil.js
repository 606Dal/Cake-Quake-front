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

// 해상도 + 용량 기준 이미지 리사이즈
export async function resizeImageUtile(file) {

    const MAX_SIZE_MB = 2
    const MAX_RESOLUTION = 1500
    const MAX_PIXEL_COUNT = 16000000   // 16MP

    try {
        const { width, height } = await getImageDimensions(file)
        const sizeMB = file.size / 1024 / 1024

        console.log(
            `[원본] ${file.name} - ${(sizeMB).toFixed(2)}MB, 해상도: ${width} x ${height}`
        )

        // 2MB 이상이고 1500px 넘으면 리사이즈, 또는 픽셀 수 초과
        const isLargeFile = sizeMB > MAX_SIZE_MB
        const isHighResolution = width > MAX_RESOLUTION || height > MAX_RESOLUTION
        const isOverPixel = width * height > MAX_PIXEL_COUNT

        const needResize = 
            isOverPixel || (isLargeFile && isHighResolution)

        // 리사이즈 필요 없으면 그대로 반환
        if (!needResize) {
            console.log('리사이즈 불필요 → 원본 유지')
            return { file, resized: false }
        }

        // 옵션
        const options = {
            maxSizeMB: MAX_SIZE_MB,
            maxWidthOrHeight: MAX_RESOLUTION,
            useWebWorker: true
        }

        const compressedBlob = await imageCompression(file, options)

        const resizedFile = new File([compressedBlob], file.name, { type: file.type })

        const resizedDim = await getImageDimensions(resizedFile)
        const resizedSizeMB = resizedFile.size / 1024 / 1024

        console.log(
            `[리사이즈 후] ${resizedFile.name} - ${(resizedSizeMB).toFixed(2)}MB, 해상도: ${resizedDim.width} x ${resizedDim.height}`
        )

        return { file: resizedFile, resized: true }

    } catch (err) {
        console.error("Image resize error:", err)
        return { file, resized: false }
    }
}