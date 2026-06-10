import { Navigate, Outlet } from 'react-router-dom'
import { useUserStore } from '../../store/user.store'

export function ProtectedRoute() {
  const { user } = useUserStore()
  const token = localStorage.getItem('token')

  console.log('ProtectedRoute - 检查权限:')
  console.log('  - Store user:', !!user)
  console.log('  - Token:', !!token)

  // 如果 store 中有用户，或者 localStorage 中有 token，说明已登录
  const isAuthenticated = !!user || !!token

  if (!isAuthenticated) {
    console.log('ProtectedRoute - 未登录，跳转到登录页')
    return <Navigate to="/login" replace />
  }

  console.log('ProtectedRoute - 已登录，允许访问')
  return <Outlet />
}
