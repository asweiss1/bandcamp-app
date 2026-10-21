import type { Metadata } from "next";
import { RegisterSw } from "@/components/register-sw";
import { WelcomeScreen } from "@/components/welcome-screen";

export const metadata: Metadata = {
  title: "Create a profile",
};

export default function WelcomePhonePage() {
  return (
    <>
      <WelcomeScreen />
      <RegisterSw />
    </>
  );
}
