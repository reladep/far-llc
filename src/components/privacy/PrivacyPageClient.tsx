'use client';

import {
  LegalPageLayout,
  P,
  UL,
  LI,
  Callout,
  RightRow,
  type LegalSection,
} from '@/components/legal/LegalPageLayout';

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

const EMAIL = 'privacy@visorindex.com';
const emailLink = (
  <a
    href={`mailto:${EMAIL}`}
    className="text-[#1A7A4A] underline decoration-[#1A7A4A]/30 underline-offset-2 transition-colors hover:text-[#2DBD74]"
  >
    {EMAIL}
  </a>
);

const sections: LegalSection[] = [
  /* ── 01 ── */
  {
    id: 'scope',
    num: '01',
    title: 'Scope of This Policy',
    content: (
      <>
        <P>
          This Policy applies to all users of the Service, including visitors who browse without
          creating an account and registered subscribers. It covers information collected directly
          from you, information collected automatically through your use of the Service, and
          information we may receive from third parties.
        </P>
        <P>
          This Policy does not govern the data practices of investment advisory firms listed or
          profiled on our platform. Those firms maintain their own privacy practices and are solely
          responsible for their own data handling.
        </P>
      </>
    ),
  },

  /* ── 02 ── */
  {
    id: 'information-we-collect',
    num: '02',
    title: 'Information We Collect',
    content: (
      <>
        <P className="mt-6 font-semibold text-[#0a1c2a]">
          2.1 &mdash; Information You Provide Directly
        </P>
        <P>
          When you create an account, subscribe to the Service, or communicate with us, we may
          collect:
        </P>
        <UL>
          <LI>Name and email address</LI>
          <LI>
            Billing information, including payment card details (processed by our third-party
            payment processor&thinsp;&mdash;&thinsp;we do not store full payment card numbers)
          </LI>
          <LI>Account credentials (password stored in hashed, encrypted form)</LI>
          <LI>
            Preferences, saved firms, alerts, and other settings you configure within the platform
          </LI>
          <LI>Communications you send to us, including support inquiries and feedback</LI>
        </UL>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          2.2 &mdash; Information Collected Automatically
        </P>
        <P>
          When you use the Service, we automatically collect certain technical and usage
          information, including:
        </P>
        <UL>
          <LI>IP address and approximate geographic location (city/region level)</LI>
          <LI>Browser type, operating system, and device identifiers</LI>
          <LI>Pages viewed, features used, search queries entered, and firms viewed or saved</LI>
          <LI>Referring URLs and exit pages</LI>
          <LI>Session duration and interaction patterns</LI>
          <LI>Cookies, pixel tags, and similar tracking technologies (see Section 6)</LI>
        </UL>

        <Callout label="Heightened Protection">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            2.3 &mdash; Financial Research Activity
          </P>
          <P>
            Because Visor Index is a financial research platform, your usage data may reflect
            sensitive financial interests&thinsp;&mdash;&thinsp;including the types of advisory
            firms you search for, your apparent asset range, and your advisory preferences. We
            treat this category of behavioral data with heightened care and do not sell or share it
            with advisory firms or financial intermediaries. See Section 4 for details on how this
            data is used.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          2.4 &mdash; Information from Third Parties
        </P>
        <P>
          We may receive limited information about you from third-party services, including:
        </P>
        <UL>
          <LI>
            Payment processors (e.g., Stripe) for billing and fraud prevention purposes
          </LI>
          <LI>Analytics providers for aggregated platform usage analysis</LI>
          <LI>Authentication providers if you use single sign-on</LI>
        </UL>
      </>
    ),
  },

  /* ── 03 ── */
  {
    id: 'how-we-use',
    num: '03',
    title: 'How We Use Your Information',
    content: (
      <>
        <P>We use the information we collect for the following purposes:</P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">To provide and operate the Service</P>
        <P>
          Creating and managing your account, processing subscription payments, delivering the
          features and Content you access, and maintaining platform functionality.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">To personalize your experience</P>
        <P>
          Surfacing relevant firm recommendations, remembering your saved searches and preferences,
          and tailoring the platform to your apparent use case.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">To improve the Service</P>
        <P>
          Analyzing usage patterns, diagnosing technical issues, developing new features, and
          refining our analytical models including the Visor Value Score.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">To communicate with you</P>
        <P>
          Sending transactional emails (receipts, alerts, password resets), product updates, and,
          where you have opted in, marketing communications. You may unsubscribe from marketing
          communications at any time.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">
          To ensure security and prevent fraud
        </P>
        <P>
          Monitoring for unauthorized access, abuse, or violations of our Terms of Service.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">To comply with legal obligations</P>
        <P>
          Responding to lawful requests from regulatory authorities, courts, or law enforcement.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">
          To support AI and analytical features
        </P>
        <P>
          Certain platform features use large language models (&ldquo;LLMs&rdquo;) to generate
          summaries, analyses, or responses. Where your inputs or queries are processed by an LLM,
          they may be transmitted to a third-party AI provider (see Section 4.3). We do not use
          your personal data to train external AI models without your consent.
        </P>
      </>
    ),
  },

  /* ── 04 ── */
  {
    id: 'how-we-share',
    num: '04',
    title: 'How We Share Your Information',
    content: (
      <>
        <Callout label="Our Commitment">
          <P>
            <strong>We do not sell your personal information.</strong> We do not sell, rent, or
            trade your personal data to advisory firms, financial intermediaries, data brokers, or
            advertisers.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">4.1 &mdash; Service Providers</P>
        <P>
          We share information with trusted third-party vendors who help us operate the Service,
          including:
        </P>
        <UL>
          <LI>
            Cloud infrastructure and database providers (e.g., Supabase) for data storage and
            application hosting
          </LI>
          <LI>Payment processors (e.g., Stripe) for subscription billing</LI>
          <LI>Email service providers for transactional and marketing communications</LI>
          <LI>Analytics providers for aggregated usage analysis</LI>
          <LI>Customer support tools for managing support inquiries</LI>
        </UL>
        <P>
          These providers are contractually obligated to use your data only as necessary to provide
          services to us and in accordance with this Policy.
        </P>

        <Callout label="Forward-Looking Disclosure">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            4.2 &mdash; Future Commercial Relationships
          </P>
          <P>
            As disclosed in our Terms of Service, Visor Index may in the future enter into
            commercial relationships with advisory firms, including sponsored placements or
            referral arrangements. In no event will we share your individually identifiable
            personal data with advisory firms as part of any such commercial arrangement without
            your explicit prior consent. Aggregated, anonymized, and de-identified data may be
            used in connection with such arrangements.
          </P>
        </Callout>

        <Callout label="AI Data Disclosure">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            4.3 &mdash; Artificial Intelligence Providers
          </P>
          <P>
            Certain features of the Service transmit user queries or platform data to third-party
            large language model providers for processing. These transmissions are governed by the
            data processing terms of those providers. We take reasonable steps to minimize the
            personal information included in such transmissions and to select providers with
            appropriate data protection commitments. We do not permit AI providers to use your data
            to train their models.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          4.4 &mdash; Legal and Regulatory Disclosures
        </P>
        <P>
          We may disclose your information if required to do so by law, regulation, court order, or
          governmental authority, or if we believe in good faith that such disclosure is necessary
          to protect the rights, property, or safety of Visor Index, our users, or the public.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">4.5 &mdash; Business Transfers</P>
        <P>
          In the event of a merger, acquisition, asset sale, or other business transfer, your
          information may be transferred as part of that transaction. We will provide notice before
          your personal data is transferred and becomes subject to a different privacy policy.
        </P>
      </>
    ),
  },

  /* ── 05 ── */
  {
    id: 'data-retention',
    num: '05',
    title: 'Data Retention',
    content: (
      <>
        <P>
          We retain your personal information for as long as your account is active or as needed to
          provide the Service. If you close your account, we will delete or anonymize your personal
          data within a reasonable period, except where we are required to retain it for legal,
          regulatory, or fraud prevention purposes.
        </P>
        <P>
          Aggregated and anonymized data derived from your usage may be retained indefinitely as it
          no longer identifies you.
        </P>
      </>
    ),
  },

  /* ── 06 ── */
  {
    id: 'cookies',
    num: '06',
    title: 'Cookies and Tracking Technologies',
    content: (
      <>
        <P>
          Visor Index uses cookies and similar technologies to operate and improve the Service.
          Categories of cookies we use include:
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">Strictly necessary cookies</P>
        <P>
          Required for the Service to function, including authentication and session management.
          These cannot be disabled.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">Functional cookies</P>
        <P>
          Remember your preferences and settings to personalize your experience.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">Analytics cookies</P>
        <P>
          Help us understand how users interact with the platform. Data is aggregated and used to
          improve the Service. We use privacy-respecting analytics configurations where possible.
        </P>

        <P className="mt-5 font-semibold text-[#0a1c2a]">Marketing cookies</P>
        <P>
          Only deployed where you have provided consent. Used to measure the effectiveness of our
          marketing efforts. We do not use behavioral advertising networks that track you across
          third-party websites.
        </P>

        <P>
          You may manage cookie preferences through your browser settings or our cookie consent
          interface. Disabling certain cookies may affect platform functionality.
        </P>
      </>
    ),
  },

  /* ── 07 ── */
  {
    id: 'data-security',
    num: '07',
    title: 'Data Security',
    content: (
      <>
        <P>
          We implement industry-standard technical and organizational security measures to protect
          your personal information from unauthorized access, disclosure, alteration, or
          destruction. These include:
        </P>
        <UL>
          <LI>Encryption of data in transit (TLS) and at rest</LI>
          <LI>Hashed and salted password storage</LI>
          <LI>Access controls limiting data access to authorized personnel</LI>
          <LI>Regular security assessments</LI>
        </UL>
        <P>
          No method of transmission or storage is completely secure. In the event of a data breach
          that affects your personal information, we will notify you as required by applicable law.
        </P>
      </>
    ),
  },

  /* ── 08 ── */
  {
    id: 'your-rights',
    num: '08',
    title: 'Your Rights and Choices',
    content: (
      <>
        <P>
          Depending on your jurisdiction, you may have the following rights regarding your personal
          data:
        </P>
        <div className="mt-5">
          <RightRow name="Access">
            Request a copy of the personal data we hold about you.
          </RightRow>
          <RightRow name="Correction">
            Request correction of inaccurate or incomplete personal data.
          </RightRow>
          <RightRow name="Deletion">
            Request deletion of your personal data, subject to legal retention requirements.
          </RightRow>
          <RightRow name="Portability">
            Request your data in a structured, machine-readable format.
          </RightRow>
          <RightRow name="Opt-out of marketing">
            Unsubscribe from marketing emails at any time via the link in any such email or
            through your account settings.
          </RightRow>
          <RightRow name="Withdraw consent">
            Where processing is based on consent, withdraw that consent at any time.
          </RightRow>
        </div>
        <P>
          To exercise any of these rights, contact us at {emailLink}. We will respond within the
          timeframe required by applicable law.
        </P>
      </>
    ),
  },

  /* ── 09 ── */
  {
    id: 'ccpa',
    num: '09',
    title: 'California Residents — CCPA / CPRA',
    content: (
      <>
        <P>
          If you are a California resident, you have additional rights under the California
          Consumer Privacy Act (&ldquo;CCPA&rdquo;) as amended by the California Privacy Rights
          Act (&ldquo;CPRA&rdquo;), including the right to:
        </P>
        <div className="mt-5">
          <RightRow name="Know">
            What personal information we collect, use, disclose, or sell.
          </RightRow>
          <RightRow name="Delete">
            Your personal information (subject to exceptions).
          </RightRow>
          <RightRow name="Opt out">
            Of the sale or sharing of personal information&thinsp;&mdash;&thinsp;we do not sell or
            share personal information as defined under the CCPA.
          </RightRow>
          <RightRow name="Correct">
            Inaccurate personal information.
          </RightRow>
          <RightRow name="Limit">
            The use of sensitive personal information.
          </RightRow>
          <RightRow name="Non-discrimination">
            For exercising your privacy rights.
          </RightRow>
        </div>
        <P>
          To submit a CCPA request, contact us at {emailLink} or use the designated request
          mechanism in your account settings. We will verify your identity before processing your
          request.
        </P>
      </>
    ),
  },

  /* ── 10 ── */
  {
    id: 'gdpr',
    num: '10',
    title: 'European and UK Users — GDPR',
    content: (
      <>
        <P>
          If you are located in the European Economic Area (&ldquo;EEA&rdquo;) or the United
          Kingdom, the processing of your personal data is subject to the General Data Protection
          Regulation (&ldquo;GDPR&rdquo;) or UK GDPR, as applicable.
        </P>
        <div className="mt-5">
          <RightRow name="Legal bases for processing">
            We process your personal data on the following legal bases: performance of a contract
            (to provide the Service you subscribed to), legitimate interests (to improve the
            Service, ensure security, and conduct analytics), compliance with legal obligations,
            and consent (for marketing communications and optional cookies).
          </RightRow>
          <RightRow name="Data transfers">
            Your data may be transferred to and processed in countries outside the EEA or UK,
            including the United States. Where such transfers occur, we rely on appropriate
            safeguards including Standard Contractual Clauses.
          </RightRow>
          <RightRow name="Data Protection Officer">
            You may contact our data protection contact at {emailLink}.
          </RightRow>
          <RightRow name="Right to lodge a complaint">
            You have the right to lodge a complaint with your local supervisory authority if you
            believe we have processed your data unlawfully.
          </RightRow>
        </div>
      </>
    ),
  },

  /* ── 11 ── */
  {
    id: 'childrens-privacy',
    num: '11',
    title: "Children's Privacy",
    content: (
      <P>
        The Service is not directed at children under the age of 13, and we do not knowingly
        collect personal information from children under 13. If we become aware that we have
        inadvertently collected information from a child under 13, we will take prompt steps to
        delete it. If you believe we have collected such information, please contact us at{' '}
        {emailLink}.
      </P>
    ),
  },

  /* ── 12 ── */
  {
    id: 'third-party-links',
    num: '12',
    title: 'Third-Party Links',
    content: (
      <P>
        The Service may contain links to third-party websites, including SEC.gov, FINRA&rsquo;s
        BrokerCheck, and advisory firm websites. This Policy does not apply to those sites. We
        encourage you to review the privacy policies of any third-party sites you visit.
      </P>
    ),
  },

  /* ── 13 ── */
  {
    id: 'changes',
    num: '13',
    title: 'Changes to This Policy',
    content: (
      <P>
        We may update this Policy from time to time. Material changes will be communicated by
        updating the &ldquo;Last Updated&rdquo; date at the top of this page and, where
        appropriate, by notifying you via email or a prominent notice on the platform. Your
        continued use of the Service following any update constitutes your acceptance of the
        revised Policy.
      </P>
    ),
  },

  /* ── 14 ── */
  {
    id: 'contact',
    num: '14',
    title: 'Contact Us',
    content: (
      <P>
        For questions, concerns, or requests regarding this Privacy Policy or your personal data,
        please contact us at {emailLink}.
      </P>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function PrivacyPageClient() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="March 13, 2026"
      intro={
        <>
          This Privacy Policy (&ldquo;Policy&rdquo;) describes how Visor Index collects, uses,
          stores, shares, and protects information about you when you access or use the Visor Index
          website, platform, and associated services. By using the Service, you acknowledge that
          you have read and understood this Policy.
        </>
      }
      sections={sections}
      footerQuestion="Questions about our Privacy Policy?"
      footerEmail="privacy@visorindex.com"
    />
  );
}
