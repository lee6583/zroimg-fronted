import Link from "next/link";
import { ThemeControls } from "@/components/layout/theme-controls";
import { LoginForm } from "@/features/auth/login-form";
import styles from "./login.module.css";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className={styles.loginPage__topbar}>
        <Link href="/" className={styles.loginPage__brand}>
          ZroImg
        </Link>
        <ThemeControls />
      </header>

      <section className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-2xl font-medium tracking-tight">欢迎回来</h1>
            <p className="mt-2 text-sm text-muted">输入你的邮箱和密码，继续你的图像创作。</p>
          </div>
          <LoginForm />
          <p className="mt-5 text-center text-sm text-muted">
            还没有账号？{" "}
            <Link href="/register" className="font-medium text-foreground hover:underline">
              开启创作之旅
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
