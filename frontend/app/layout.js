import localFont from "next/font/local";
import "./globals.css";
import { ToastContainer, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { UserProvider } from "@/providers/UserProvider";
import { EmailNotificationProvider } from "@/providers/EmailNotificationProvider";
import RoleSelectionWrapper from "@/components/RoleSelectionWrapper";
import { Suspense } from "react";
import ConditionalAIChatbot from "@/components/ConditionalAIChatbot";

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
          <EmailNotificationProvider>
            <RoleSelectionWrapper>
              {children}
              <ConditionalAIChatbot />
            </RoleSelectionWrapper>
          </EmailNotificationProvider>
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
