import { useEffect, useRef } from 'react'

interface Task {
  status: string
  error?: string
}

/** 指数退避轮询默认参数 */
const DEFAULT_BASE_INTERVAL = 1000
const DEFAULT_MAX_INTERVAL = 16000

/**
 * 任务轮询选项
 * @template T 任务数据类型
 */
export interface TaskPollingOptions<T = unknown> {
  taskId: string
  onUpdate?: (task: T) => void
  onCompleted?: (task: T) => void
  onFailed?: (error: string, task: T) => void
  fetchTask: (taskId: string) => Promise<{ data: T }>
  /** @deprecated 指数退避模式下忽略，保留以兼容旧调用 */
  interval?: number
  enabled?: boolean
  maxFailures?: number
  onError?: () => void
}

/**
 * 任务轮询钩子 — 使用指数退避策略
 *
 * 每次轮询成功后，间隔翻倍直到上限（1000ms → 2000ms → 4000ms → ... → 16000ms），
 * 有效减少长时间轮询对服务端的压力，避免触发限流。
 *
 * @template T 任务数据类型
 */
export function useTaskPolling<T = unknown>({
  taskId,
  onUpdate,
  onCompleted,
  onFailed,
  fetchTask,
  enabled = true,
  maxFailures = 5,
  onError,
}: TaskPollingOptions<T>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const failCountRef = useRef(0)
  const currentDelayRef = useRef(DEFAULT_BASE_INTERVAL)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !taskId) return

    failCountRef.current = 0
    currentDelayRef.current = DEFAULT_BASE_INTERVAL
    stoppedRef.current = false

    const stopPolling = () => {
      stoppedRef.current = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const scheduleNext = (delayMs: number) => {
      timerRef.current = setTimeout(poll, delayMs)
    }

    const poll = async () => {
      if (stoppedRef.current) return

      try {
        const { data: task } = await fetchTask(taskId)
        failCountRef.current = 0
        onUpdate?.(task)

        if ((task as unknown as Task).status === 'completed') {
          stopPolling()
          onCompleted?.(task)
          return
        } else if ((task as unknown as Task).status === 'failed') {
          stopPolling()
          onFailed?.((task as unknown as Task).error || '任务失败', task)
          return
        }

        // 指数退避：每次成功获取后翻倍，不超过上限
        currentDelayRef.current = Math.min(
          currentDelayRef.current * 2,
          DEFAULT_MAX_INTERVAL,
        )
        scheduleNext(currentDelayRef.current)
      } catch (error) {
        console.error('轮询任务失败:', error)
        failCountRef.current++

        if (failCountRef.current >= maxFailures) {
          stopPolling()
          onError?.()
          return
        }

        // 出错时也增加延迟，避免连续冲击
        currentDelayRef.current = Math.min(
          currentDelayRef.current * 1.5,
          DEFAULT_MAX_INTERVAL,
        )
        scheduleNext(currentDelayRef.current)
      }
    }

    // 首次立即执行
    poll()

    return stopPolling
  }, [
    taskId,
    enabled,
    fetchTask,
    onUpdate,
    onCompleted,
    onFailed,
    maxFailures,
    onError,
  ])
}

/**
 * 批量任务轮询选项
 * @template T 任务数据类型
 */
export interface BatchTaskPollingOptions<T = unknown> {
  taskIds: string[]
  fetchTask: (taskId: string) => Promise<{ data: T }>
  /** @deprecated 指数退避模式下忽略，保留以兼容旧调用 */
  interval?: number
  enabled?: boolean
  maxFailures?: number
  onUpdate?: (completedCount: number) => void
  onAllDone?: (completedCount: number) => void
  onError?: (error: string) => void
}

/**
 * 批量任务轮询钩子 — 使用指数退避策略
 *
 * 串行获取状态以避免并发请求过多。
 * 所有任务完成（completed/failed）时触发 onAllDone；
 * 网络连续失败 maxFailures 次时触发 onError。
 */
export function useBatchTaskPolling<T = unknown>({
  taskIds,
  fetchTask,
  enabled = true,
  maxFailures = 5,
  onUpdate,
  onAllDone,
  onError,
}: BatchTaskPollingOptions<T>) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stoppedRef = useRef(false)

  useEffect(() => {
    if (!enabled || taskIds.length === 0) return

    let failCount = 0
    let currentDelay = DEFAULT_BASE_INTERVAL
    stoppedRef.current = false

    const stopPolling = () => {
      stoppedRef.current = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }

    const scheduleNext = (delayMs: number) => {
      timerRef.current = setTimeout(poll, delayMs)
    }

    const poll = async () => {
      if (stoppedRef.current) return

      try {
        let completed = 0
        let allDone = true

        for (const taskId of taskIds) {
          const { data: task } = await fetchTask(taskId)
          if (
            (task as unknown as Task).status === 'completed' ||
            (task as unknown as Task).status === 'failed'
          ) {
            completed++
          } else {
            allDone = false
          }
        }

        failCount = 0
        onUpdate?.(completed)

        if (allDone) {
          stopPolling()
          onAllDone?.(completed)
          return
        }

        currentDelay = Math.min(currentDelay * 2, DEFAULT_MAX_INTERVAL)
        scheduleNext(currentDelay)
      } catch (err) {
        console.error('轮询任务失败:', err)
        failCount++

        if (failCount >= maxFailures) {
          stopPolling()
          onError?.('请求过于频繁，请稍后重试')
          return
        }

        currentDelay = Math.min(currentDelay * 1.5, DEFAULT_MAX_INTERVAL)
        scheduleNext(currentDelay)
      }
    }

    // 首次立即执行
    poll()

    return stopPolling
  }, [taskIds, enabled, fetchTask, onUpdate, onAllDone, onError, maxFailures])
}
