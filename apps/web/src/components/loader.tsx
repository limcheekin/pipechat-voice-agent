import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
	className?: string;
}

export default function Loader({ className }: LoaderProps) {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<Loader2 className={cn("animate-spin", className)} />
		</div>
	);
}
