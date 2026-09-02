"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQ_ITEMS } from "./landing-data";

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-default">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-medium text-foreground">
          {question}
        </span>
        <ChevronDown
          className={[
            "h-5 w-5 shrink-0 text-muted transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>
      <div
        className={[
          "grid transition-all duration-200",
          open ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]",
        ].join(" ")}
      >
        <div className="overflow-hidden">
          <p className="text-sm leading-relaxed text-secondary">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
		<section
			id='faq'
			className='scroll-mt-20 border-default bg-background py-20 sm:py-24'
		>
			<div className='mx-auto max-w-3xl px-4 sm:px-6 lg:px-8'>
				<div className='text-center'>
					<h2 className='mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl'>
						Frequently asked questions
					</h2>
					<p className='mt-4 text-base text-secondary'>
						Everything you need to know about Bika-File. Can&apos;t find what you&apos;re looking for?{" "}
						<a
							href='/contact'
							className='text-primary hover:text-primary-hover'
						>
							Contact us
						</a>
						.
					</p>
				</div>

				<div className='mt-12 rounded-2xl border border-default bg-surface p-4 shadow-sm sm:p-6'>
					{FAQ_ITEMS.map((item) => (
						<FAQItem
							key={item.question}
							question={item.question}
							answer={item.answer}
						/>
					))}
				</div>
			</div>
		</section>
  );
}
