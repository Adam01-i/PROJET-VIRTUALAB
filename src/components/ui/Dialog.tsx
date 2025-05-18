// src/components/ui/dialog.tsx
import * as React from "react";
import { useState, ReactNode } from "react";
import { cn } from "../../lib/utils";

interface DialogProps {
  children: ReactNode;
}

interface DialogTriggerProps {
  asChild?: boolean;
  children: React.ReactNode;
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const DialogContext = React.createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

export function Dialog({ children }: DialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <DialogContext.Provider value={{ open, setOpen }}>{children}</DialogContext.Provider>
  );
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogTrigger must be used inside Dialog");

  const handleClick = () => context.setOpen(true);
  return (
    <div onClick={handleClick} className="cursor-pointer">
      {children}
    </div>
  );
}

export function DialogContent({ children, className }: DialogContentProps) {
  const context = React.useContext(DialogContext);
  if (!context) throw new Error("DialogContent must be used inside Dialog");

  const handleClose = () => context.setOpen(false);

  if (!context.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={cn(
          "bg-white rounded-xl p-6 w-full max-w-md shadow-lg animate-in fade-in zoom-in",
          className
        )}
      >
        {children}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleClose}
            className="text-sm text-purple-600 hover:underline"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
