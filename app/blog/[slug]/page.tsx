import { BlogArticle } from "@/components/blog/BlogArticle";

export default function BlogSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  return <BlogArticle slug={params.slug} />;
}
