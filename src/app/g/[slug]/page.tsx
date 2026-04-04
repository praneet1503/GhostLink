import GhostLinkExperience from "@/components/GhostLinkExperience";

interface GhostLinkPageProps {
  params:
    | {
        slug: string;
      }
    | Promise<{
    slug: string;
      }>;
}

export default async function GhostLinkPage({ params }: GhostLinkPageProps) {
  const resolvedParams = await params;

  return <GhostLinkExperience slug={resolvedParams.slug} />;
}
