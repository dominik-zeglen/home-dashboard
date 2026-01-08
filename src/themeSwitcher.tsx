import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useLocalStorage } from "./useLocalStorage";
import { Button } from "@/components/ui/button";

export function ThemeSwitcher() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "dark");
  React.useEffect(() => {
    document.documentElement.classList.remove(
      theme === "light" ? "dark" : "light",
    );
    document.documentElement.classList.add(theme);
  }, [theme]);

  const Icon = theme === "light" ? Moon : Sun;

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Icon className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all" />
    </Button>
  );
}
