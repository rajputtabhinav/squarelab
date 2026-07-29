export const clerkAppearance = {
  variables: {
    colorPrimary: "#18181b",
    colorText: "#18181b",
    colorTextSecondary: "#52525b",
    colorBackground: "rgba(255,255,255,0.94)",
    colorInputBackground: "rgba(255,255,255,0.96)",
    colorInputText: "#18181b",
    colorDanger: "#dc2626",
    colorSuccess: "#15803d",
    borderRadius: "1rem",
    fontFamily: "var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card:
      "w-full rounded-[28px] border border-white/85 bg-white/95 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-xl",
    headerTitle: "text-3xl font-semibold tracking-tight text-zinc-900",
    headerSubtitle: "text-sm text-zinc-600",
    formFieldLabel: "text-sm font-medium text-zinc-700",
    formFieldInput:
      "h-12 rounded-xl border border-zinc-200/90 bg-white text-zinc-900 shadow-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-0",
    formButtonPrimary:
      "h-12 rounded-xl border-0 bg-zinc-900 text-sm font-medium text-white shadow-none hover:bg-zinc-800",
    footerActionText: "text-sm text-zinc-600",
    footerActionLink: "text-sm font-medium text-zinc-900 hover:text-zinc-700",
    dividerLine: "bg-zinc-200/80",
    dividerText: "text-zinc-400 bg-transparent",
    identityPreviewText: "text-zinc-700",
    identityPreviewEditButton: "text-zinc-900 hover:text-zinc-700",
    alertText: "text-sm",
    formFieldErrorText: "text-xs text-red-600",
    formFieldSuccessText: "text-xs text-emerald-700",
    otpCodeFieldInput:
      "rounded-xl border border-zinc-200/90 bg-white text-zinc-900 shadow-none",
    formResendCodeLink: "text-zinc-900 hover:text-zinc-700",
    footer:
      "border-t border-zinc-200/80 bg-white/92 backdrop-blur-md rounded-b-[28px]",
    userButtonPopoverCard:
      "border border-white/85 bg-white/96 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-xl",
    userButtonPopoverMain:
      "bg-white/96",
    userButtonPopoverFooter:
      "border-t border-zinc-200/80 bg-white/92",
    userButtonPopoverActionButton:
      "hover:bg-zinc-100/90",
    userButtonPopoverActionButtonText:
      "text-zinc-800",
    userPreview:
      "bg-white/96",
    userPreviewMainIdentifier:
      "text-zinc-900",
    userPreviewSecondaryIdentifier:
      "text-zinc-600",
    modalContent:
      "overflow-hidden rounded-[28px] border border-white/85 bg-white/98 shadow-[0_24px_80px_rgba(24,24,27,0.16)] backdrop-blur-xl",
    modalCloseButton:
      "rounded-none text-zinc-500 hover:text-zinc-800 hover:bg-transparent shadow-none",
    navbar:
      "rounded-none border-r border-zinc-200/80 bg-transparent shadow-none md:rounded-l-[28px]",
    navbarMobileMenuRow:
      "rounded-none rounded-t-[28px] border-b border-zinc-200/80 bg-transparent shadow-none",
    navbarMobileMenuButton:
      "rounded-none bg-transparent shadow-none text-zinc-900",
    navbarButton:
      "rounded-xl",
    pageScrollBox:
      "rounded-none bg-transparent shadow-none rounded-b-[28px] md:rounded-b-none md:rounded-r-[28px]",
    page:
      "rounded-none bg-transparent shadow-none",
    profilePage:
      "rounded-none bg-transparent shadow-none",
    profileSection:
      "rounded-none bg-transparent shadow-none",
    profileSectionPrimaryButton:
      "rounded-xl",
    profileSectionContent:
      "rounded-none bg-transparent shadow-none",
    accordionTriggerButton:
      "rounded-none bg-transparent shadow-none",
    accordionContent:
      "rounded-none bg-transparent shadow-none",
  },
} as const;
