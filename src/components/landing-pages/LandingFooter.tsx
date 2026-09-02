import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { LandingBrandLogo } from "./LandingBrandLogo";
import { FOOTER_CONTACT, FOOTER_LINKS } from "./landing-data";
import { LandingFooterLink } from "./LandingNavLink";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <LandingFooterLink href={link.href} label={link.label} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
		<footer className='border-default bg-background'>
			<div className='mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8'>
				<div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8'>
					<div className='sm:col-span-2 lg:col-span-5'>
						<LandingBrandLogo />
						<p className='mt-4 max-w-sm text-sm leading-relaxed text-secondary'>
							Secure document management for teams that need organization, collaboration, and peace of
							mind — all in one vault.
						</p>

						<ul className='mt-6 space-y-3'>
							<li>
								<a
									href={`mailto:${FOOTER_CONTACT.email}`}
									className='inline-flex items-center gap-2.5 text-sm text-secondary no-underline transition hover:text-primary hover:no-underline'
								>
									<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default bg-white text-primary'>
										<Mail className='h-3.5 w-3.5' />
									</span>
									{FOOTER_CONTACT.email}
								</a>
							</li>
							<li className='flex items-center gap-2.5 text-sm text-secondary'>
								<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default bg-white text-primary'>
									<Phone className='h-3.5 w-3.5' />
								</span>
								{FOOTER_CONTACT.phone}
							</li>
							<li className='flex items-center gap-2.5 text-sm text-secondary'>
								<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-default bg-white text-primary'>
									<MapPin className='h-3.5 w-3.5' />
								</span>
								{FOOTER_CONTACT.location}
							</li>
						</ul>
					</div>

					<div className='lg:col-span-2 lg:col-start-7'>
						<FooterColumn
							title='Product'
							links={FOOTER_LINKS.product}
						/>
					</div>

					<div className='lg:col-span-2'>
						<FooterColumn
							title='Account'
							links={FOOTER_LINKS.account}
						/>
					</div>

					<div className='lg:col-span-2'>
						<FooterColumn
							title='Support'
							links={FOOTER_LINKS.support}
						/>
					</div>
				</div>

				<div className='mt-12 flex flex-col gap-4 border-t border-default pt-8 sm:flex-row sm:items-center sm:justify-between'>
					<p className='text-sm text-muted'>© {year} bikafile. All rights reserved.</p>
					<div className='flex flex-wrap gap-x-6 gap-y-2 text-sm'>
						<Link
							href='/features'
							className='text-secondary no-underline transition hover:text-primary hover:no-underline'
						>
							Features
						</Link>
						<Link
							href='/#pricing'
							className='text-secondary no-underline transition hover:text-primary hover:no-underline'
						>
							Pricing
						</Link>
						<Link
							href='/contact'
							className='text-secondary no-underline transition hover:text-primary hover:no-underline'
						>
							Contact
						</Link>
					</div>
				</div>
			</div>
		</footer>
  );
}
