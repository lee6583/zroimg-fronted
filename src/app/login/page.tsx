import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="font-serif text-xl font-medium tracking-tight">
            ZroCodeImg
          </Link>
          <Link href="/register" className="text-sm font-medium text-muted transition hover:text-foreground">
            注册
          </Link>
        </div>
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
