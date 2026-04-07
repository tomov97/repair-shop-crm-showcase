"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel: string;
  name?: string;
  value?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "default" | "compact";
};

export function SubmitButton({
  label,
  pendingLabel,
  name,
  value,
  variant = "primary",
  size = "default",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const styles =
    variant === "primary"
      ? "bg-surface-strong text-white shadow-[0_20px_40px_rgba(35,68,63,0.18)]"
      : variant === "danger"
        ? "bg-[#c0392b] text-white shadow-[0_14px_28px_rgba(192,57,43,0.28)]"
        : "border border-border bg-white text-foreground";
  const sizing =
    size === "compact"
      ? "h-8 w-[8.25rem] rounded-lg px-2.5 text-sm font-semibold leading-none"
      : "min-h-12 rounded-2xl px-4 py-3 text-sm";

  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending}
      className={`inline-flex items-center justify-center font-semibold transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${sizing} ${styles}`}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
