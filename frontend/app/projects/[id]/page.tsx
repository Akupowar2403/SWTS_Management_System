"use client";

import { use } from "react";
import ProjectDetail from "../../components/project/ProjectDetail";

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <div className="h-full overflow-auto bg-white">
      <ProjectDetail projectId={Number(id)} />
    </div>
  );
}
