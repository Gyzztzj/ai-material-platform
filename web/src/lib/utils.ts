import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getFullImageUrl(imageUrl: string): string {
  // data: / blob: / http(s): 开头的直接返回，不需要拼接 baseUrl
  if (/^(data:|blob:|https?:)/i.test(imageUrl)) {
    return imageUrl
  }
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
  return `${baseUrl}${imageUrl}`
}

export function extractImagePath(fullUrl: string): string {
  // data: / blob: URI 不需要提取路径
  if (/^(data:|blob:)/i.test(fullUrl)) {
    return fullUrl
  }
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000"
  if (fullUrl.startsWith(baseUrl)) {
    return fullUrl.replace(baseUrl, "")
  }
  return fullUrl
}

export async function downloadFile(url: string, filename?: string): Promise<void> {
  const response = await fetch(url)
  const blob = await response.blob()
  const blobUrl = window.URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = blobUrl
  link.download = filename || `download-${Date.now()}`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(blobUrl)
}

export function extractErrorMsg(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const axiosError = error as unknown as {
      response?: { data?: { message?: string } }
    }
    return axiosError.response?.data?.message || error.message || fallback
  }
  return fallback
}