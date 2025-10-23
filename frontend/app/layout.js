import localFont from "next/font/local";
import "./globals.css";
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from "@/providers/UserProvider";
import { EmailNotificationProvider } from "@/providers/EmailNotificationProvider";
import { TimerProvider } from "@/providers/TimerProvider";
import { DashboardFilterProvider } from "@/providers/DashboardFilterProvider";
import RoleSelectionWrapper from "@/components/RoleSelectionWrapper";
import TimerBanner from "@/components/TimerBanner";
import { Suspense } from "react";
import ConditionalAIChatbot from "@/components/ConditionalAIChatbot";
import QuickActionsBar from "@/components/QuickActionsBar";
import { QuickActions } from "@/components/quickActions";
import TopNavigation from "@/components/TopNavigation";
import ConditionalQuickActions from "@/components/ConditionalQuickActions";

export const metadata = {
  title: "flexywexy.com",
  description: "Provider Project management service",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <UserProvider>
            <TimerProvider>
              <EmailNotificationProvider>
                <DashboardFilterProvider>
                  <RoleSelectionWrapper>
                    {/* <QuickActionsBar /> */}

                    <ConditionalQuickActions>
                      <TimerBanner />
                      <div className="">
                        {children}
                      </div>
                      <ConditionalAIChatbot />
                    </ConditionalQuickActions>

                  </RoleSelectionWrapper>
                </DashboardFilterProvider>
              </EmailNotificationProvider>
            </TimerProvider>
          </UserProvider>

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            transition={Bounce}
          />
        </Suspense>
      </body>
    </html>
  );
}
