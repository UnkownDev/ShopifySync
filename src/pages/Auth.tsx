import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, LogIn } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { toast } from "sonner";

interface AuthProps {
  redirectAfterAuth?: string;
  // Force showing the auth flow even if already authenticated
  force?: boolean;
  // NEW: render compactly when embedded inside another dialog/container
  embedded?: boolean;
}

function Auth({ redirectAfterAuth, force, embedded }: AuthProps = {}) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Consider both the prop and the query param
  const forceAuth = force || new URLSearchParams(location.search).get("force") === "1";
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only auto-redirect if we are NOT forcing the auth screen
    if (!forceAuth && !authLoading && isAuthenticated) {
      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    }
  }, [forceAuth, authLoading, isAuthenticated, navigate, redirectAfterAuth]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to send verification code. Please try again.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);

      console.log("signed in");

      const redirect = redirectAfterAuth || "/";
      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError("The verification code you entered is incorrect.");
      setIsLoading(false);

      setOtp("");
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Use the Convex deployment URL where the auth HTTP routes are registered
      const convexBase = (import.meta.env.VITE_CONVEX_URL as string).replace(/\/$/, "");
      const signInUrl = `${convexBase}/api/auth/signin/google`;

      const win = window.open(signInUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        // Fallback: full page navigation if popup blocked
        window.location.href = signInUrl;
      } else {
        toast.message("Complete Google sign-in in the new tab, then return here.");
      }
    } catch (error) {
      console.error("Google login error (open):", error);
      try {
        await signIn("google");
      } catch (inner) {
        console.error("Google login error (fallback):", inner);
        const raw = inner instanceof Error ? inner.message : String(inner);
        let friendly = "Google sign-in failed. Please try again.";
        if (/invalid_client/i.test(raw)) {
          friendly = "Google sign-in is not configured correctly (invalid_client). Check Client ID/Secret and redirect URI.";
        } else if (/access_denied|403/i.test(raw)) {
          friendly = "Access denied by Google. If your app is in Testing, add your email as a Test user.";
        } else if (/Provider `google` is not configured|not configured/i.test(raw)) {
          friendly = "Google provider is not enabled on the server.";
        } else if (/oauth client was not found/i.test(raw)) {
          friendly = "Google OAuth is not set up. Add your Client ID/Secret in Integrations and ensure the redirect URI matches.";
        } else if (/popup|blocked/i.test(raw)) {
          friendly = "Popup blocked. Please allow popups or try again.";
        }
        setError(friendly);
        toast.error(friendly);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? ""
          : "min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white"
      }
    >
      {/* Auth Content */}
      <div className={embedded ? "" : "flex-1 flex items-center justify-center"}>
        <div className={embedded ? "" : "flex items-center justify-center h-full flex-col"}>
          {/* Make popup compact and remove borders */}
          <Card
            className={
              embedded
                // NEW: when embedded, use full width and remove background/border/shadow to match outer card
                ? "w-full p-0 bg-transparent border-0 shadow-none text-white"
                : "w-80 md:w-96 p-5 bg-slate-900/70 border-0 shadow-xl text-white rounded-none"
            }
          >
            {step === "signIn" ? (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center">
                    <img
                      src="/logo.svg"
                      alt="ShopifySync Logo"
                      width={56}
                      height={56}
                      className="rounded-md mb-3 mt-2 cursor-pointer shadow-[0_0_40px_rgba(16,185,129,0.25)]"
                      onClick={() => navigate("/")}
                    />
                  </div>
                  <CardTitle className="text-lg">Get Started</CardTitle>
                  <CardDescription className="text-xs">
                    Enter your email to log in or sign up
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleEmailSubmit}>
                  {/* Compact content area */}
                  <CardContent className="pt-0 pb-3">
                    <div className="relative flex items-center gap-2">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          name="email"
                          placeholder="name@example.com"
                          type="email"
                          className="pl-9 bg-transparent"
                          disabled={isLoading}
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="default"
                        size="icon"
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {error && (
                      <p className="mt-2 text-xs text-red-500">{error}</p>
                    )}

                    {/* Tighten divider spacing */}
                    <div className="mt-3">
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-[10px] uppercase">
                          <span className="bg-transparent px-2 text-muted-foreground">
                            Or
                          </span>
                        </div>
                      </div>

                      {/* Compact buttons and avoid white borders */}
                      <Button
                        type="button"
                        variant="default"
                        className="w-full mt-3 bg-white/10 text-white hover:bg-white/20"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign in with Google
                      </Button>
                    </div>
                  </CardContent>
                </form>
              </>
            ) : (
              <>
                <CardHeader className="text-center mt-2 pb-2">
                  <CardTitle className="text-lg">Check your email</CardTitle>
                  <CardDescription className="text-xs">
                    We've sent a code to {step.email}
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleOtpSubmit}>
                  <CardContent className="pt-0 pb-3">
                    <input type="hidden" name="email" value={step.email} />
                    <input type="hidden" name="code" value={otp} />

                    <div className="flex justify-center">
                      <InputOTP
                        value={otp}
                        onChange={setOtp}
                        maxLength={6}
                        disabled={isLoading}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && otp.length === 6 && !isLoading) {
                            const form = (e.target as HTMLElement).closest("form");
                            if (form) form.requestSubmit();
                          }
                        }}
                      >
                        <InputOTPGroup>
                          {Array.from({ length: 6 }).map((_, index) => (
                            <InputOTPSlot key={index} index={index} />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    {error && (
                      <p className="mt-2 text-xs text-red-500 text-center">
                        {error}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Didn't receive a code?{" "}
                      <Button
                        variant="link"
                        className="p-0 h-auto text-emerald-300"
                        onClick={() => setStep("signIn")}
                      >
                        Try again
                      </Button>
                    </p>
                  </CardContent>

                  {/* Compact footer buttons */}
                  <CardFooter className="flex-col gap-2 pt-0 pb-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || otp.length !== 6}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify code
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("signIn")}
                      disabled={isLoading}
                      className="w-full"
                    >
                      Use different email
                    </Button>
                  </CardFooter>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}