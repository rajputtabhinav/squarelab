import { SignIn } from "@clerk/nextjs";
import AuthFrame from "@/components/AuthFrame";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignInPage() {
  return (
    <AuthFrame>
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </AuthFrame>
  );
}
