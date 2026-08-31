"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";

import { Button } from "@/components/ui/button";
import {
  getClientAuth,
  googleAuthProvider,
  mapClientAuthError,
} from "@/lib/firebase/client";

type GoogleSignInButtonProps = {
  label: string;
  pending?: boolean;
  disabled?: boolean;
  extraFields?: () => Record<string, string>;
  onToken: (formData: FormData) => void;
  onError: (message: string) => void;
};

export function GoogleSignInButton({
  label,
  pending = false,
  disabled = false,
  extraFields,
  onToken,
  onError,
}: GoogleSignInButtonProps) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const credential = await signInWithPopup(getClientAuth(), googleAuthProvider());
      const idToken = await credential.user.getIdToken();
      const formData = new FormData();
      formData.set("idToken", idToken);
      const extras = extraFields?.() ?? {};
      for (const [key, value] of Object.entries(extras)) {
        formData.set(key, value);
      }
      onToken(formData);
    } catch (error) {
      onError(mapClientAuthError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={disabled || pending || busy}
      onClick={() => {
        void handleClick();
      }}
    >
      {busy || pending ? "Connecting to Google..." : label}
    </Button>
  );
}
