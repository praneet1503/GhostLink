import GhostLinkExperience from "@/components/GhostLinkExperience";

interface GhostLinkPageProps {
  params: {
    slug: string;
  };
}

export default function GhostLinkPage({ params }: GhostLinkPageProps) {
  return <GhostLinkExperience slug={params.slug} />;
}
