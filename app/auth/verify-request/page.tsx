import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function VerifyRequest() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-lg shadow-lg text-center">
        <div>
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground mt-2">
            A sign in link has been sent to your email address.
          </p>
        </div>
        
        <div className="py-4">
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
            className="mx-auto text-primary"
          >
            <path d="M22 10.5V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h16a2 2 0 0 0 2-2v-3.5" />
            <path d="M14 11h8" />
            <path d="M18 15h4" />
            <path d="M6 8h4" />
            <path d="m2 8 4 4 4-4" />
          </svg>
        </div>
        
        <div>
          <p className="text-sm text-muted-foreground">
            The link will expire in 24 hours. If you don't see the email, check your spam folder.
          </p>
        </div>
      </div>
    </div>
  );
} 