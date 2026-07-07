import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-serif text-xl font-medium tracking-tight">
            ZroCodeImg
          </Link>
          <Link href="/login" className="text-sm font-medium text-muted transition hover:text-foreground">
            登录
          </Link>
        </div>
      </header>

      <section className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="font-serif text-2xl font-medium tracking-tight">开启创作之旅</h1>
            <p className="mt-2 text-sm text-muted">注册账号，领取初始积分，把第一句灵感变成图片。</p>
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
