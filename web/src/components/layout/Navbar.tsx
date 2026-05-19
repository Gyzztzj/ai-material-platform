import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '../ui/button'
import { useUserStore } from '../../store/user.store'
import { Sun, Moon } from 'lucide-react'

// 定义 NavLink 的 active 类名
const navLinkActiveClass = 'text-primary font-semibold'
const navLinkDefaultClass =
  'text-sm font-medium hover:text-primary transition-colors'

export function Navbar() {
  const { user, logout } = useUserStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (savedUser && token) {
      // 如果有user但store里没有，初始化一下
    }
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4">
        <NavLink to="/" className="font-bold text-xl">
          AI素材平台
        </NavLink>

        <div className="ml-auto flex items-center space-x-6">
          <NavLink
            to="/generate"
            className={({ isActive }) =>
              `${navLinkDefaultClass} ${isActive ? navLinkActiveClass : ''}`
            }
          >
            AI生成
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `${navLinkDefaultClass} ${isActive ? navLinkActiveClass : ''}`
            }
          >
            素材库
          </NavLink>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="relative"
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">切换主题</span>
          </Button>
          {user ? (
            <>
              <span className="text-sm">{user.email}</span>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                退出
              </Button>
            </>
          ) : (
            <NavLink to="/login" className={navLinkDefaultClass}>
              登录
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  )
}
