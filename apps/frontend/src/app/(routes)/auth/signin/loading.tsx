import { DotBackground } from "@/components/Aceternity/DotBackground";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="h-screen flex flex-col items-center justify-center">
      <DotBackground>
        <Skeleton className="h-[300px] w-[400px] rounded-xl shadow-md" />
      </DotBackground>
    </div>
  );
}
