export const getFileSizeInMb = (file) => {
    if (!file.size) return 0
    const sizeInMb = file.size / 1024 ** 2
    return Number.isInteger(sizeInMb) ? sizeInMb : sizeInMb.toFixed(2)
  }
  
  export const getFileUrl = (domain, fileId) => {
    return `${domain}/api/file/${fileId}`
  }