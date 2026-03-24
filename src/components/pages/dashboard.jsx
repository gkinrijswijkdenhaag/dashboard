import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Calendar,
  FileText,
  Users,
  CheckCircle,
  AlertCircle,
  Edit,
  Clock,
  MessageCircle,
  Mail,
  Upload,
  Plus,
  Lock,
} from "lucide-react";
import { WorkflowBoard } from "../workflow";
import { WeekSelector } from "../layout/week-selector";
// Removed import for old InlineChatComponent
import { ServiceAssignments } from "../layout/service-assignments";
import { WelcomeBanner } from "../layout/welcome-banner";
import { Footer } from "../ui/footer";
import { Header } from "../layout/header";
import {
  getDefaultSelectedWeek,
  getUpcomingSundays,
} from "../../lib/date-utils";
import { RecentUpdates } from "../layout/recent-updates";
import { useAssignments } from "../assignments/context/AssignmentsContext";
import authService from "../../services/authService";
import { GlobalChat } from "../notifications/global-chat-updated";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    // Try to get user from localStorage on initial load
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [selectedWeek, setSelectedWeek] = useState(getDefaultSelectedWeek());
  const [welcomeBannerDismissed, setWelcomeBannerDismissed] = useState(false);
  const [mockServices, setMockServices] = useState([]);
  const { assignments } = useAssignments();

  // Initialize services using the shared date utility
  useEffect(() => {
    const sundays = getUpcomingSundays(4);

    const services = sundays.map((sunday, index) => ({
      id: index + 1,
      date: sunday.dateString,
      title: `Sunday Service - ${sunday.title}`,
      status: index === 0 ? "in-progress" : "pending",
      currentStep: index === 0 ? 1 : 0,
      totalSteps: 7,
      assignedTo: "liturgy",
      documents: [], // Start with empty documents
    }));

    setMockServices(services);

    // Set the initial selected week to the first Sunday
    if (services.length > 0) {
      setSelectedWeek(services[0].date);
    }
  }, []);

  // Find the current service based on the selected week
  // This needs to be more robust to handle date mismatches
  const currentService = useMemo(() => {
    if (!selectedWeek || mockServices.length === 0) return null;

    // Try direct match first
    let service = mockServices.find((s) => s.date === selectedWeek);

    // If no direct match, find the closest date
    if (!service) {
      const selectedDateTime = new Date(selectedWeek).getTime();

      service = mockServices.reduce((closest, current) => {
        const currentTime = new Date(current.date).getTime();
        const closestTime = closest
          ? new Date(closest.date).getTime()
          : Infinity;

        const currentDiff = Math.abs(currentTime - selectedDateTime);
        const closestDiff = Math.abs(closestTime - selectedDateTime);

        return currentDiff < closestDiff ? current : closest;
      }, null);
    }

    return service;
  }, [selectedWeek, mockServices]);

  // Handle logout using auth service
  const handleLogout = () => {
    setUser(null);
    authService.logout();
    // Note: authService.logout() already redirects to login page
  };

  // If user is null, redirect to login
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // If no user is logged in, don't render the main app
  if (!user) {
    return null; // Return null while redirecting
  }

  // Handle starting an action
  const handleStartAction = (stepId) => {
    if (stepId === 1) {
      navigate("/create-document");
    }
    // Handle other step actions as needed
  };

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <Header
          title="GKIN RWDH Dienst Dashboard"
          subtitle="Manage tasks for every service"
          user={user}
          onLogout={handleLogout}
          showGoogleDrive={true}
          showNotifications={true}
          showUserInfo={true}
          showLogout={true}
        />

        {/* Week Selector - Responsive */}
        <div className="overflow-x-auto">
          <WeekSelector
            selectedWeek={selectedWeek}
            onWeekChange={setSelectedWeek}
          />
        </div>

        {/* Welcome Banner - for first-time users */}
        {!welcomeBannerDismissed &&
          user.role === "liturgy" &&
          currentService?.currentStep === 1 && (
            <WelcomeBanner
              userName={user.username}
              roleName={user.role}
              onStartAction={handleStartAction}
              onDismiss={() => setWelcomeBannerDismissed(true)}
            />
          )}

        {/* Main Content - Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Left Column - Service Assignments and Workflow Board */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Service Assignments - At top */}
            <ServiceAssignments selectedDate={selectedWeek} />

            {/* Workflow Board - Below Service Assignments */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">
                  Workflow Progress for {selectedWeek ? new Date(selectedWeek).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  }) : 'No date selected'} service
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Track document progress through all stages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <WorkflowBoard
                  service={currentService}
                  currentUserRole={user.role}
                  onStartAction={handleStartAction}
                  dateString={selectedWeek}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Updates */}
          <div className="space-y-4 md:space-y-6">
            {/* Removed old Inline Chat Component */}

            {/* Recent Updates */}
            <Card>
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-lg md:text-xl">
                  Recent Updates
                </CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Latest activity and workflow changes
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <RecentUpdates limit={4} />
              </CardContent>
            </Card>
          </div>
        </div>

       

       
      </div>
      
      {/* Global Chat Component */}
      <GlobalChat defaultExpanded={false} />
      <Footer />
    </div>
  );
}

export default Dashboard;
