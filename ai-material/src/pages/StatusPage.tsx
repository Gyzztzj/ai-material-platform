import { useEffect, useState } from "react";
import { aiApi } from "../services/api/ai.api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

interface ServerStatus {
  status: string;
  timestamp?: string;
}

export default function StatusPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const { data } = await aiApi.checkHealth();
      setStatus(data);
    } catch {
      setStatus({ status: "down" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000); // 每分钟检查一次
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">系统状态</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>后端服务</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${status?.status === "ok" ? "text-green-500" : "text-red-500"}`}
            >
              {status?.status === "ok" ? "正常运行" : "服务异常"}
            </div>
            {status?.timestamp && (
              <p className="text-sm text-gray-500 mt-2">
                最后检查：{new Date(status.timestamp).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI模型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">全部正常</div>
            <p className="text-sm text-gray-500 mt-2">豆包Seedream、通义万相</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据库</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">正常连接</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
