import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../services/api/user.api";
import { useUserStore } from "../store/user.store";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const setUser = useUserStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await userApi.login(email, password);
      console.log("登录响应数据:", data);
      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? (err as unknown as { response?: { data?: { message?: string } } })
              .response?.data?.message || err.message
          : "登录失败";
      console.error("登录失败:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await userApi.register(email, password);
      console.log("注册响应数据:", data);
      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? (err as unknown as { response?: { data?: { message?: string } } })
              .response?.data?.message || err.message
          : "注册失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError("");
    setEmail("demo@demo.com");
    setPassword("demo123456");

    try {
      const { data } = await userApi.login("demo@demo.com", "demo123456");
      console.log("一键体验响应数据:", data);
      localStorage.setItem("token", data.access_token);
      setUser(data.user);
      navigate("/");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? (err as unknown as { response?: { data?: { message?: string } } })
              .response?.data?.message || err.message
          : "登录失败";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">AI素材平台</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleQuickDemo}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={loading}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            一键体验
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                或使用账号登录
              </span>
            </div>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label>邮箱</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label>密码</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <label>邮箱</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label>密码（至少6位）</label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
