"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  let errorMessage = "";
  switch (error) {
    case "CredentialsSignin":
      errorMessage = "Invalid email or password.";
      break;
    case "OAuthAccountNotLinked":
      errorMessage = "Email already in use with a different provider.";
      break;
    case "EmailSignin":
      errorMessage = "Failed to send verification email.";
      break;
    case "Callback":
      errorMessage = "Authentication callback error.";
      break;
    case "AccessDenied":
      errorMessage = "Access denied. You don't have permission to view this page.";
      break;
    default:
      errorMessage = "An error occurred during authentication.";
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg text-center">
        <div className="flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-destructive mb-4"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h1 className="text-3xl font-bold">Authentication Error</h1>
        </div>
        
        <div>
          <p className="text-muted-foreground">
            {errorMessage}
          </p>
        </div>
        
        <div className="pt-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">
              Back to Sign In
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
} 