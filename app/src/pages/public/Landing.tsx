import { FinalCta } from './landing/FinalCta';
import { Faq } from './landing/Faq';
import { Hero } from './landing/Hero';
import { HowItWorks } from './landing/HowItWorks';
import { PlansRow } from './landing/PlansRow';
import { WhatItDoes } from './landing/WhatItDoes';
import { WhatYouSee } from './landing/WhatYouSee';

/**
 * Route "/". One job: make a small-business owner start the free trial.
 * Order: hero, Kako deluje, Kaj pomočnik naredi, Kaj vidite vi, Paketi, Pogosta vprašanja, final call to action.
 */
export default function Landing() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <WhatItDoes />
      <WhatYouSee />
      <PlansRow />
      <Faq />
      <FinalCta />
    </>
  );
}
