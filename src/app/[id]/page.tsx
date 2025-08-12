import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShortLinkRedirect({ params }: PageProps) {
  const { id } = await params;
  // 重定向到API路由处理
  redirect(`/api/redirect/${id}`);
}