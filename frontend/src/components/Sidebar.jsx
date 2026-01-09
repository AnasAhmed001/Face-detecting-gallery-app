import { useNavigate, useLocation } from "react-router-dom";
import { Camera, Menu, LayoutDashboard, Users, Calendar } from "lucide-react";
import { useUserContext } from "../context/UserContext";
import {
  Sidebar as ShadSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";


export default function Sidebar({ children }) {
  const { user, role } = useUserContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Build menu items using current role (module-scope role variable was undefined)
  const menuItems = [
    {
      text: "Dashboard",
      path: role === "admin" ? "/AdminDashboard": "/dashboard",
      icon: LayoutDashboard,
    },
    { text: "Photographers", path: "/photographers", icon: Users },
    { text: "Events", path: "/events", icon: Calendar },
  ];

  const getUserDisplayName = () => {
    if (!user) return "User";
    if (user.displayName) {
      const name = user.displayName.split(" ")[0];
      return name.length > 4 ? `${name.substring(0, 4)}...` : name;
    }
    if (user.email) {
      const name = user.email.split("@")[0];
      return name.length > 4 ? `${name.substring(0, 4)}...` : name;
    }
    return "User";
  };

  const getUserInitial = () => {
    if (!user) return "U";
    if (user.displayName) return user.displayName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const filteredMenuItems =
    role === "admin"
      ? menuItems.filter((item) =>
          ["Photographers", "Dashboard"].includes(item.text)
        )
      : menuItems.filter((item) => ["Events", "Dashboard"].includes(item.text));

  function InnerSidebar({ children }) {
    const { toggleSidebar } = useSidebar();

    return (
      <>
        {/* Mobile toggle button */}
        <div className="fixed top-4 left-4 z-50 md:hidden">
          <button
            onClick={toggleSidebar}
            aria-label="Open sidebar"
            className="p-2 rounded-md bg-background"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <ShadSidebar className="min-h-screen">
          <SidebarContent className="p-4">
            <SidebarHeader className="mb-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-md bg-purple-500 flex items-center justify-center text-white">
                  <Camera className="w-5 h-5" />
                </div>
                <div className="font-bold">Saylani Moments</div>
              </div>
            </SidebarHeader>

            <SidebarMenu className="space-y-1">
              {filteredMenuItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    onClick={() => {
                      navigate(item.path);

                      // Auto-close sidebar on mobile
                      if (window.innerWidth < 640) {
                        toggleSidebar();
                      }
                    }}
                    // mark active if current path starts with item.path (handles nested routes)
                    isActive={location.pathname === item.path || location.pathname.startsWith(item.path)}
                    className="cursor-pointer"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.text}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>

            <SidebarFooter className="mt-auto pt-4">
              <div className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium">
                  {getUserInitial()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {getUserDisplayName()}
                  </div>
                  <div className="text-xs text-muted-foreground">{role}</div>
                </div>
              </div>
            </SidebarFooter>
          </SidebarContent>
        </ShadSidebar>

        {/* Main content (pages) */}
        <SidebarInset className="flex-1 bg-background">{children}</SidebarInset>
      </>
    );
  }

  return (
    <SidebarProvider>
      <InnerSidebar>{children}</InnerSidebar>
    </SidebarProvider>
  );
}
