import Link from "next/link";
import { ThemeControls } from "@/components/layout/theme-controls";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
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
            <h1 className="page-title">重置密码</h1>
          </div>
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
