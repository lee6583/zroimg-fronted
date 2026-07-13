import Link from "next/link";
import { BrandLogo } from "@/components/layout/brand-logo";
import { ThemeControls } from "@/components/layout/theme-controls";
import { RegisterForm } from "@/features/auth/register-form";
import styles from "../login/login.module.css";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className={styles.loginPage__topbar}>
        <BrandLogo />
        <ThemeControls />
      </header>

      <section className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="page-title">开启创作之旅</h1>
            <p className="page-description">注册账号，领取初始积分，把第一句灵感变成图片。</p>
          </div>
          <RegisterForm />
          <p className="mt-6 text-center text-sm text-muted">
            已有账号？{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              欢迎回来
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
