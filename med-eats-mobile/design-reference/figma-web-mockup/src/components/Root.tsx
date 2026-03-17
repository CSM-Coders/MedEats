import { Outlet, useLocation, useNavigate } from "react-router";
import { Home, Compass, PlusSquare, User } from "lucide-react";

export function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Don't show bottom nav on restaurant detail pages
  const showBottomNav = !location.pathname.includes('/restaurant/');

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/feed", icon: Compass, label: "Feed" },
    { path: "/create", icon: PlusSquare, label: "Create" },
    { path: "/profile", icon: User, label: "Profile" }
  ];

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      {/* iPhone 13/14 Frame */}
      <div className="relative w-[390px] h-[844px] bg-white rounded-[3rem] shadow-2xl overflow-hidden border-8 border-gray-800">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-3xl z-50"></div>
        
        {/* Content Area */}
        <div className="h-full w-full overflow-hidden bg-white">
          <Outlet />
        </div>

        {/* Bottom Navigation Bar */}
        {showBottomNav && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-200 flex items-center justify-around px-8 pb-6 z-40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 transition-all"
                >
                  <Icon
                    className={`w-6 h-6 ${
                      isActive ? "text-[#FF6B35]" : "text-gray-400"
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span
                    className={`text-xs ${
                      isActive ? "text-[#FF6B35] font-semibold" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
