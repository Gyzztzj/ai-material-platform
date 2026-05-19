import { NavLink } from "react-router-dom";

// 侧边栏选中样式
const sidebarActiveClass = "bg-blue-50 text-blue-600 font-medium";
const sidebarDefaultClass = "block p-3 rounded-lg hover:bg-gray-100 transition-colors";

export function Sidebar() {
  return (
    <div className="w-64 border-r p-4 space-y-2">
      <NavLink 
        to="/generate" 
        className={({ isActive }) => 
          `${sidebarDefaultClass} ${isActive ? sidebarActiveClass : ""}`
        }
      >
        🎨 AI图片生成
      </NavLink>
      <NavLink 
        to="/remove-bg" 
        className={({ isActive }) => 
          `${sidebarDefaultClass} ${isActive ? sidebarActiveClass : ""}`
        }
      >
        ✂️ AI抠图
      </NavLink>
      <NavLink 
        to="/batch" 
        className={({ isActive }) => 
          `${sidebarDefaultClass} ${isActive ? sidebarActiveClass : ""}`
        }
      >
        📦 批量处理
      </NavLink>
      <NavLink 
        to="/library" 
        className={({ isActive }) => 
          `${sidebarDefaultClass} ${isActive ? sidebarActiveClass : ""}`
        }
      >
        📁 我的素材库
      </NavLink>
    </div>
  );
}
