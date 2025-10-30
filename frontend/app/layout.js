import { Roboto, Noto_Sans_Hebrew } from "next/font/google";
import { Suspense } from "react";
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./globals.css";
import { UserProvider } from "@/providers/UserProvider";
import { EmailNotificationProvider } from "@/providers/EmailNotificationProvider";
import { TimerProvider } from "@/providers/TimerProvider";
import { DashboardFilterProvider } from "@/providers/DashboardFilterProvider";
import { TabProvider } from "@/providers/TabProvider";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

// Configure Google Fonts with Next.js optimization
const roboto = Roboto({
  weight: ["100", "300", "400", "500", "700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto",
});

const notoSansHebrew = Noto_Sans_Hebrew({
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["hebrew"],
  display: "swap",
  variable: "--font-noto-sans-hebrew",
});

export const metadata = {
  title: "flexywexy.com",
  description: "Provider Project management service",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${roboto.variable} ${notoSansHebrew.variable}`}>
      <body>
        <Suspense>
          <UserProvider>
            <TimerProvider>
              <EmailNotificationProvider>
                <DashboardFilterProvider>
                  <TabProvider>
                    <ClientLayoutWrapper>
                      {children}
                    </ClientLayoutWrapper>
                  </TabProvider>
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