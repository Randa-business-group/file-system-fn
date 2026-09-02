import { AlertTriangle, FolderX, ShieldOff, UsersRound } from "lucide-react";
import { PROBLEM_POINTS } from "./landing-data";

const ICONS = {
  "folder-x": FolderX,
  "shield-off": ShieldOff,
  "users-x": UsersRound,
} as const;

export function ProblemSection() {
  return (
		<section className='border-default bg-background py-20 sm:py-24'>
			<div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
				{/* Section header */}
				<div className='mx-auto max-w-2xl text-center'>
					<h2 className='mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
						Your documents are costing you
					</h2>
					<p className='mt-4 text-base leading-relaxed text-secondary'>
						Most organizations don&apos;t realize how much time, money, and security they lose to
						disorganized file management — until it&apos;s too late.
					</p>
				</div>

				{/* Problem cards */}
				<div className='mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
					{PROBLEM_POINTS.map((point) => {
						const Icon = ICONS[point.icon];
						return (
							<article
								key={point.title}
								className='group relative rounded-2xl border border-default bg-surface p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-8'
							>
								{/* Icon */}
								<span className='flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-error'>
									<Icon className='h-6 w-6' />
								</span>

								{/* Title */}
								<h3 className='mt-5 text-lg font-semibold text-foreground'>{point.title}</h3>

								{/* Description */}
								<p className='mt-3 text-sm leading-relaxed text-secondary'>{point.description}</p>

								{/* Cost callout */}
								<div className='mt-5 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5'>
									<AlertTriangle className='mt-0.5 h-4 w-4 shrink-0 text-error' />
									<p className='text-xs font-medium leading-relaxed text-error'>{point.cost}</p>
								</div>
							</article>
						);
					})}
				</div>
			</div>
		</section>
  );
}
