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

interface ModelInfo {
  modelId: string;
  name: string;
  provider: string;
  enabled: boolean;
  quality: number;
}

export default function StatusPage() {
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [modelStatus, setModelStatus] = useState<{
    total: number;
    enabled: number;
    failed: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const [healthResult, modelsResult] = await Promise.allSettled([
        aiApi.checkHealth(),
        aiApi.getModels(),
      ]);

      if (healthResult.status === "fulfilled") {
        setStatus(healthResult.value.data);
      } else {
        setStatus({ status: "down" });
      }

      if (modelsResult.status === "fulfilled") {
        const models = modelsResult.value.data;
        const allModels: ModelInfo[] = [
          ...(models.generate || []),
          ...(models.removeBg || []),
          ...(models.imageEdit || []),
        ];
        const uniqueModels = allModels.filter(
          (m, i, arr) => arr.findIndex((x) => x.modelId === m.modelId) === i,
        );
        setModelStatus({
          total: uniqueModels.length,
          enabled: uniqueModels.filter((m) => m.enabled).length,
          failed: uniqueModels.filter((m) => !m.enabled).length,
        });
      } else {
        setModelStatus({ total: 0, enabled: 0, failed: 0 });
      }
    } catch {
      setStatus({ status: "down" });
      setModelStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  const dbStatus = status?.status === "ok";
  const backendStatus = status?.status === "ok";
  const aiStatus = modelStatus && modelStatus.enabled > 0;

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
              className={`text-2xl font-bold ${backendStatus ? "text-green-500" : "text-red-500"}`}
            >
              {backendStatus ? "正常运行" : "服务异常"}
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
            <div
              className={`text-2xl font-bold ${aiStatus ? "text-green-500" : "text-red-500"}`}
            >
              {aiStatus
                ? `${modelStatus?.enabled}/${modelStatus?.total} 可用`
                : modelStatus === null
                  ? "检查失败"
                  : "无可用模型"}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {modelStatus
                ? `共 ${modelStatus.total} 个模型，${modelStatus.enabled} 个启用`
                : "未能获取模型信息"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>数据库</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${dbStatus ? "text-green-500" : "text-red-500"}`}
            >
              {dbStatus ? "正常连接" : "连接异常"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
