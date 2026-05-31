import { BarChart3, BookOpen, Home, Library, PlusCircle, UserRound } from "lucide-react";

export const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/library", label: "作品架", icon: Library },
  { href: "/log", label: "记录", icon: PlusCircle },
  { href: "/analytics", label: "统计", icon: BarChart3 },
  { href: "/profile", label: "我", icon: UserRound },
  { href: "/vocab", label: "生词", icon: BookOpen, secondary: true }
] as const;
