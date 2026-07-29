import { SignUp } from "@clerk/nextjs";
import AuthFrame from "@/components/AuthFrame";
import { clerkAppearance } from "@/lib/clerkAppearance";

export default function SignUpPage() {
  return (
    <AuthFrame>
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
        appearance={clerkAppearance}
      />
    </AuthFrame>
  );
}
