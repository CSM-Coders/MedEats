import { useNavigate } from "react-router";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-white">
      <h1 className="text-6xl mb-4">404</h1>
      <p className="text-gray-600 mb-6">Page not found</p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-3 bg-[#FF6B35] text-white rounded-full"
      >
        Go Home
      </button>
    </div>
  );
}
