import { LoadingSpinner } from "./LoadingSpinner";

export default function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-500">加载中...</p>
    </div>
  );
}
