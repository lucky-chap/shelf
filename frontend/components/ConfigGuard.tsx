import React from "react";

interface Props {
  children: React.ReactNode;
}

export default function ConfigGuard({ children }: Props) {
  // Digital Store (Stripe) has been removed; no blocking configuration remains.
  // Unsplash is optional and handled in the UI where applicable.
  return <>{children}</>;
}
