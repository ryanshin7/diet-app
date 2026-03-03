import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background to-muted">
      <div className="mx-auto max-w-2xl text-center px-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          식단 관리
        </h1>
        <p className="mt-6 text-lg text-muted-foreground leading-8">
          매일의 식단을 기록하고 건강한 식습관을 만들어보세요.
          <br />
          AI가 맞춤 식단을 추천하고, 칼로리와 영양소를 자동으로 관리합니다.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-4">
          <Button asChild size="lg">
            <Link href="/login">시작하기</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/signup">회원가입</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
