import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "./ui/button";
import { useUserContext } from "../context/UserContext";
import { toast } from "sonner"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./ui/breadcrumb";
import { Home, ChevronRight, LogOut } from "lucide-react";

export default function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, role } = useUserContext();
  const pathnames = location.pathname.split('/').filter((x) => x);


  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out!");
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error(error?.message || "Failed to log out. Please try again.");
    }
  };

  // Define route mappings for better display names and breadcrumb structure
  const routeConfig = {
    'dashboard': { name: 'Home', icon: Home },
    'photographers': { name: 'Photographers' },
    'events': { name: 'Events' },
    'faces': { name: 'Faces' },
    'faceDetails': { name: 'Face Details' },
    // Add dynamic routes
    'id': (segment, pathArray, index) => {
      // Check what the parent route is to determine the name
      const parentRoute = pathArray[index - 1];
      if (parentRoute === 'events') return 'Event Details';
      return segment;
    },
    'userId': () => 'User Photos',
  };

  // Function to get display name for a route segment
  const getDisplayName = (segment, pathArray, index) => {
    const config = routeConfig[segment];
    if (typeof config === 'function') {
      return config(segment, pathArray, index);
    }
    if (config && config.name) {
      return config.name;
    }
    // Default formatting for unknown routes
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
  };

  // Function to determine if we should show this segment in breadcrumbs
  const shouldShowSegment = (segment, pathArray, index) => {
    // Hide userId from breadcrumbs as it's just an ID
    if (segment === 'userId' || /^[0-9a-fA-F-]{20,}$/.test(segment)) {
      return false;
    }
    return true;
  };

  // Filter and process pathnames
  const visibleSegments = pathnames.filter((segment, index) => 
    shouldShowSegment(segment, pathnames, index)
  );

  return (
    <div className="fixed top-0 right-0 left-0 md:left-[var(--sidebar-width)] z-40 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300 w-full md:w-[calc(100%-var(--sidebar-width))]" style={{ '--sidebar-width': '14rem' }}>
      <div className="container mx-auto px-4 h-full flex items-center justify-between">
        <Breadcrumb className="overflow-hidden">
          <BreadcrumbList>
            {visibleSegments.length === 0 || (visibleSegments.length === 1 && visibleSegments[0] === 'dashboard') ? (
              // Show just Home when on dashboard or root
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={role === 'admin' ? '/AdminDashboard' : '/dashboard'} className="flex items-center gap-1.5 font-medium">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            ) : (
              // Show full breadcrumb trail
              <>
                {/* Always show Home as first item if not on dashboard */}
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={role === 'admin' ? '/AdminDashboard' : '/dashboard'} className="flex items-center gap-1.5 hover:underline">
                      <Home className="h-4 w-4" />
                      Home
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                
                {/* Show path segments (excluding dashboard) */}
                {visibleSegments
                  .filter(segment => segment !== 'dashboard')
                  .map((segment, index, filteredArray) => {
                    // Find the original index in pathnames
                    const originalIndex = pathnames.indexOf(segment);
                    const routeTo = `/${pathnames.slice(0, originalIndex + 1).join('/')}`;
                    const isLast = index === filteredArray.length - 1;
                    const displayName = getDisplayName(segment, pathnames, originalIndex);
                    
                    return (
                      <React.Fragment key={`${segment}-${originalIndex}`}>
                        <BreadcrumbSeparator>
                          <ChevronRight className="h-4 w-4" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage className="font-medium">
                              {displayName}
                            </BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink asChild>
                              <Link to={routeTo} className="hover:underline">
                                {displayName}
                              </Link>
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                      </React.Fragment>
                    );
                  })}
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
        </Button>
        <ThemeToggle />
      </div>
      </div>
    </div>
  );
}