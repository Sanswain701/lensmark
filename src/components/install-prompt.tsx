import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "lensmark.install.dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // standalone? skip
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS
      window.navigator.standalone === true;
    if (standalone) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS Safari fallback hint
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (isIOS) {
      const t = setTimeout(() => setIosHint(true), 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
    setIosHint(false);
  };

  const install = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } finally {
      dismiss();
    }
  };

  if (!show && !iosHint) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-border bg-card/95 px-4 py-2.5 shadow-lg backdrop-blur">
        <Download className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <div className="min-w-0 flex-1 text-xs">
          {show ? (
            <p className="truncate">
              <span className="font-medium text-foreground">Install LensMark</span>{" "}
              <span className="text-muted-foreground">— a quieter home for photography.</span>
            </p>
          ) : (
            <p className="truncate text-muted-foreground">
              Add to Home Screen via <span className="text-foreground">Share → Add to Home Screen</span>
            </p>
          )}
        </div>
        {show ? (
          <button
            onClick={install}
            className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Install
          </button>
        ) : null}
        <button
          aria-label="Dismiss"
          onClick={dismiss}
          className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}