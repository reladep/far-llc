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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const EMAIL = 'legal@visorindex.com';

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[#1A7A4A] underline decoration-[#1A7A4A]/30 underline-offset-2 transition-colors hover:text-[#2DBD74]"
    >
      {children}
    </a>
  );
}

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

const sections: LegalSection[] = [
  /* ── 01 ── */
  {
    id: 'regulatory-status',
    num: '01',
    title: 'Regulatory Status',
    content: (
      <>
        <P>
          Visor Index is not registered with, licensed by, or affiliated with any financial
          regulatory authority, including but not limited to:
        </P>
        <UL>
          <LI>
            The U.S. Securities and Exchange Commission (&ldquo;SEC&rdquo;) as an investment
            adviser or broker-dealer
          </LI>
          <LI>
            The Financial Industry Regulatory Authority (&ldquo;FINRA&rdquo;) as a broker-dealer
            or associated person
          </LI>
          <LI>
            Any state securities regulator as an investment adviser representative or financial
            planner
          </LI>
        </UL>
        <P>
          Visor Index operates solely as an independent data aggregation, analytics, and publishing
          platform. We are not subject to the fiduciary duties imposed on registered investment
          advisers under the Investment Advisers Act of 1940 or applicable state law. Nothing about
          our regulatory status should be construed as an endorsement, oversight, or supervision of
          this platform or its Content by any governmental or regulatory body.
        </P>
        <P>
          The investment advisory firms profiled on this platform are separately registered with the
          SEC and/or applicable state regulators. Their regulatory status is their own and does not
          extend to Visor Index.
        </P>
      </>
    ),
  },

  /* ── 02 ── */
  {
    id: 'not-investment-advice',
    num: '02',
    title: 'Not Investment Advice',
    callout: true,
    content: (
      <>
        <P>
          The Content on this platform&thinsp;&mdash;&thinsp;including firm profiles, data tables,
          analytical summaries, the Visor Value Score, comparisons, rankings, fee analyses, and any
          other information&thinsp;&mdash;&thinsp;is provided exclusively for informational and
          comparative purposes.
        </P>
        <P>
          Visor Index does not provide investment advice. Nothing on this platform should be
          construed as a recommendation, solicitation, or offer to buy or sell any security, or to
          engage or avoid any particular investment advisory firm or financial professional.
        </P>
        <P>
          The decision to hire a financial adviser is a consequential personal financial decision
          that depends on individual circumstances including investment objectives, risk tolerance,
          time horizon, tax situation, liquidity needs, and personal preference. Visor Index does
          not have knowledge of your individual circumstances and does not tailor its Content to any
          individual user&rsquo;s situation.
        </P>
        <P>
          Users should conduct their own independent due diligence and, where appropriate, consult
          with a licensed attorney, accountant, or financial professional before making any advisory
          engagement decision.
        </P>
      </>
    ),
  },

  /* ── 03 ── */
  {
    id: 'not-investment-manager',
    num: '03',
    title: 'Not an Investment Manager',
    content: (
      <>
        <P>
          Visor Index does not manage, advise on, or exercise discretion over any investment assets
          or portfolios. We do not:
        </P>
        <div className="mt-5">
          <RightRow name="Accept or hold">client assets</RightRow>
          <RightRow name="Execute or recommend">specific securities transactions</RightRow>
          <RightRow name="Construct or manage">
            investment portfolios on behalf of any person
          </RightRow>
          <RightRow name="Act as">
            a custodian, trustee, or fiduciary for any user or third party
          </RightRow>
        </div>
        <P>
          Any references on this platform to investment strategies, asset classes, portfolio
          construction approaches, or market commentary are general and educational in nature. They
          do not represent personalized investment management services and should not be treated as
          such.
        </P>
      </>
    ),
  },

  /* ── 04 ── */
  {
    id: 'compensation',
    num: '04',
    title: 'Compensation and Conflicts of Interest',
    content: (
      <>
        <Callout label="Current Compensation">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            4.1 &mdash; Current Compensation Model
          </P>
          <P>
            As of the date of this page, Visor Index&rsquo;s sole source of revenue is user
            subscription fees. We do not currently receive, and have not received:
          </P>
          <UL>
            <LI>
              Referral fees or lead generation payments from investment advisory firms
            </LI>
            <LI>Advertising revenue from advisory firms or their affiliates</LI>
            <LI>
              Revenue sharing or placement fees in connection with firm rankings or profiles
            </LI>
            <LI>
              Compensation of any kind tied to a user&rsquo;s decision to engage or not engage any
              advisory firm
            </LI>
          </UL>
          <P>
            Our analytical outputs&thinsp;&mdash;&thinsp;including the Visor Value Score and all
            firm rankings&thinsp;&mdash;&thinsp;are not influenced by any commercial relationship
            with the firms profiled.
          </P>
        </Callout>

        <Callout label="Future Disclosure">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            4.2 &mdash; Potential Future Compensation
          </P>
          <P>
            This compensation model may change. Visor Index expressly reserves the right to enter
            into commercial arrangements with advisory firms or third parties in the future, which
            may include but are not limited to sponsored content, advertising placements, referral
            fees, data licensing, or other revenue arrangements.
          </P>
          <P>In the event of any such material change, Visor Index will:</P>
          <UL>
            <LI>
              Update these Disclosures and our Terms of Service with a revised &ldquo;Last
              Updated&rdquo; date
            </LI>
            <LI>Clearly label any Content that is sponsored, promoted, or commercially influenced</LI>
            <LI>
              Distinguish between editorially independent Content and commercially influenced
              Content
            </LI>
          </UL>
          <P>
            Users are encouraged to review this page periodically. The absence of a compensation
            disclosure for any specific firm or content element reflects the state of our commercial
            relationships as of the date above and is not a permanent guarantee of independence.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">4.3 &mdash; Subscription Revenue</P>
        <P>
          Because our revenue derives from user subscriptions rather than advisory firm payments,
          our financial interests are broadly aligned with users. We benefit when users find our
          platform genuinely useful, not when users engage any particular advisory firm. However,
          this alignment is structural and general in nature and does not constitute a fiduciary or
          advisory relationship with any user.
        </P>
      </>
    ),
  },

  /* ── 05 ── */
  {
    id: 'data-sources',
    num: '05',
    title: 'Data Source Disclosures',
    content: (
      <>
        <Callout label="Self-Reported Data Warning">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            5.1 &mdash; SEC Form ADV Data
          </P>
          <P>
            The primary data source underlying firm profiles on Visor Index is Form ADV, the
            registration and disclosure document filed by SEC-registered investment advisers with
            the SEC via the Investment Adviser Registration Depository (&ldquo;IARD&rdquo;). This
            includes Parts 1A, 1B, 2A, and 2B of Form ADV.
          </P>
          <P>
            This data is self-reported by the advisory firms themselves. Visor Index does not
            independently audit, verify, or investigate the accuracy of Form ADV disclosures. Firms
            may submit filings that are inaccurate, incomplete, stale, or inconsistent with their
            actual business practices, and such errors may be reflected on our platform without our
            knowledge.
          </P>
          <P>Key data fields sourced from Form ADV that are subject to self-reporting risk include:</P>
          <UL>
            <LI>Assets under management (&ldquo;AUM&rdquo;) figures</LI>
            <LI>Number of clients and client types</LI>
            <LI>Ownership and control structures</LI>
            <LI>Fee schedules and billing practices</LI>
            <LI>Services offered</LI>
            <LI>Disciplinary and regulatory history</LI>
          </UL>
          <P>
            Users should independently review a firm&rsquo;s current Form ADV filings directly on
            the SEC&rsquo;s IARD public disclosure system (available at{' '}
            <ExtLink href="https://adviserinfo.sec.gov">adviserinfo.sec.gov</ExtLink>) before
            making any engagement decision.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          5.2 &mdash; Frequency of Data Updates
        </P>
        <P>
          Form ADV data on the Visor Index platform is updated periodically. There may be a lag
          between when a firm files an amendment with the SEC and when that updated information is
          reflected on our platform. Data displayed on Visor Index should not be assumed to be
          current as of the date of your access.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          5.3 &mdash; Derived and Calculated Metrics
        </P>
        <P>
          Certain metrics displayed on Visor Index&thinsp;&mdash;&thinsp;including but not limited
          to growth rates, per-client AUM averages, fee-to-AUM ratios, employee productivity
          metrics, and other derived data points&thinsp;&mdash;&thinsp;are calculated by Visor Index
          using Form ADV source data. These calculations involve assumptions and methodological
          choices made by Visor Index that may differ from how a firm characterizes its own
          business. Such derived metrics are analytical estimates and should be treated as such.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">5.4 &mdash; Third-Party Data</P>
        <P>
          Visor Index may supplement Form ADV data with information sourced from third-party data
          providers, publicly available sources, or proprietary research. The accuracy,
          completeness, and timeliness of third-party data is subject to the practices of the
          respective source. Visor Index does not independently verify third-party data.
        </P>
      </>
    ),
  },

  /* ── 06 ── */
  {
    id: 'ai-analysis',
    num: '06',
    title: 'Artificial Intelligence and Automated Analysis',
    content: (
      <>
        <Callout label="AI Hallucination Warning">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            6.1 &mdash; Use of Large Language Models
          </P>
          <P>
            Certain Content on the Visor Index platform is generated in whole or in part using large
            language models (&ldquo;LLMs&rdquo;) and other artificial intelligence or machine
            learning systems. This may include firm summaries, analytical narratives, comparative
            commentary, and responses to user queries.
          </P>
          <P>
            AI-generated content is inherently subject to error. LLMs can produce outputs that are
            plausible in appearance but factually inaccurate, incomplete, outdated, or
            misleading&thinsp;&mdash;&thinsp;a phenomenon commonly referred to as
            &ldquo;hallucination.&rdquo; Visor Index does not warrant the factual accuracy of any
            AI-generated Content.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          6.2 &mdash; Limitations of Automated Analysis
        </P>
        <P>
          Automated analytical systems, including those used in the construction of the Visor Value
          Score and related outputs, operate on the data inputs provided to them. If underlying data
          is inaccurate, incomplete, or unrepresentative, the analytical outputs derived from that
          data will reflect those same limitations. Automated systems also cannot account for
          qualitative factors, relationship dynamics, individual suitability considerations, or
          other dimensions of an advisory relationship that may be material to a given user&rsquo;s
          decision.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          6.3 &mdash; No Substitute for Independent Judgment
        </P>
        <P>
          AI-generated summaries and automated analytical outputs are intended as a starting point
          for research, not a conclusion. Users should independently verify any material fact before
          relying upon it and should not make advisory engagement decisions based solely on
          AI-generated Content.
        </P>
      </>
    ),
  },

  /* ── 07 ── */
  {
    id: 'visor-value-score',
    num: '07',
    title: 'The Visor Value Score',
    content: (
      <>
        {/* Thin navy top border for visual distinction */}
        <div className="mt-5 border-t-2 border-[#0a1c2a] pt-6">
          <P className="font-semibold text-[#0a1c2a]">7.1 &mdash; Purpose</P>
          <P>
            The Visor Value Score (&ldquo;Score&rdquo;) is a proprietary analytical rating
            developed by Visor Index to facilitate structured comparison among SEC-registered
            investment advisory firms. It is designed to help users identify and shortlist firms for
            further review, not to render a definitive verdict on any firm&rsquo;s quality,
            suitability, or trustworthiness.
          </P>
        </div>

        <Callout label="Critical Disclaimer">
          <P className="mt-2 font-semibold text-[#0a1c2a]/90">
            7.2 &mdash; What the Score Is Not
          </P>
          <P>The Score is explicitly not:</P>
          <div className="mt-4">
            <RightRow name="Not a guarantee">
              of investment performance, client satisfaction, or advisory quality
            </RightRow>
            <RightRow name="Not a determination">
              that any firm is suitable or unsuitable for any individual investor
            </RightRow>
            <RightRow name="Not an endorsement">
              certification, or seal of approval by Visor Index or any regulatory authority
            </RightRow>
            <RightRow name="Not a complete assessment">
              of any firm&rsquo;s culture, integrity, responsiveness, or relationship
              quality&thinsp;&mdash;&thinsp;dimensions that no quantitative score can fully capture
            </RightRow>
          </div>

          {/* Key disclaimer in Cormorant italic, slightly larger */}
          <p className="mt-6 font-serif text-[18px] italic leading-snug text-[#0a1c2a]/85 md:text-[20px]">
            A higher Visor Value Score does not guarantee a favorable outcome.
          </p>
          <P>
            A lower Score does not disqualify a firm from being an excellent match for a specific
            investor&rsquo;s needs.
          </P>
        </Callout>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          7.3 &mdash; Methodology and Inputs
        </P>
        <P>
          The Score is constructed from a defined set of quantitative inputs derived primarily from
          Form ADV data, supplemented by Visor Index&rsquo;s analytical models. The specific
          weighting, criteria, and methodology underlying the Score are proprietary to Visor Index
          and subject to change at our discretion without prior notice.
        </P>
        <P>
          Because the Score relies heavily on self-reported Form ADV data, it inherits all of the
          limitations of that data source described in Section 5. A firm that accurately reports
          strong metrics will generally Score higher than a firm that underreports or files
          inconsistently&thinsp;&mdash;&thinsp;which may or may not reflect actual relative quality.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">
          7.4 &mdash; Comparative Use Only
        </P>
        <P>
          The Score is calibrated for relative comparison within the Visor Index universe of firms
          at a given point in time. It should not be interpreted as an absolute rating or compared
          across different time periods, as methodology updates may affect Score values
          independently of changes in the underlying firms.
        </P>
      </>
    ),
  },

  /* ── 08 ── */
  {
    id: 'forward-looking',
    num: '08',
    title: 'Forward-Looking Statements',
    content: (
      <P>
        Certain Content on the Visor Index platform may contain forward-looking statements
        regarding advisory firms, industry trends, or the platform itself, including statements
        regarding expected growth, future services, or anticipated market conditions. These
        statements are based on information available at the time of publication and involve
        inherent uncertainty. Actual outcomes may differ materially from those expressed or implied.
        Visor Index undertakes no obligation to update forward-looking statements following
        publication.
      </P>
    ),
  },

  /* ── 09 ── */
  {
    id: 'past-performance',
    num: '09',
    title: 'Past Performance',
    content: (
      <P>
        Where historical data regarding advisory firm AUM growth, client growth, or other metrics
        is presented on this platform, such historical data is not necessarily indicative of future
        results. Past growth does not guarantee future performance. Users should not interpret
        historical firm metrics as a predictor of future advisory outcomes.
      </P>
    ),
  },

  /* ── 10 ── */
  {
    id: 'no-endorsement',
    num: '10',
    title: 'No Endorsement of Third-Party Firms',
    content: (
      <>
        <P>
          The inclusion of any investment advisory firm in the Visor Index database, platform, or
          analytics does not constitute an endorsement, recommendation, or approval of that firm by
          Visor Index. Conversely, the exclusion of any firm&thinsp;&mdash;&thinsp;whether due to
          registration status, data availability, or any other reason&thinsp;&mdash;&thinsp;does not
          imply a negative assessment of that firm.
        </P>
        <P>
          Visor Index does not endorse, recommend, or oppose any specific investment advisory firm,
          financial product, or investment strategy.
        </P>
      </>
    ),
  },

  /* ── 11 ── */
  {
    id: 'disciplinary-history',
    num: '11',
    title: 'Disciplinary and Regulatory History',
    content: (
      <P>
        Where Visor Index displays or summarizes regulatory, disciplinary, or legal history for
        advisory firms, such information is sourced from publicly available SEC disclosures and is
        presented as reported. Visor Index does not investigate, adjudicate, or render judgment on
        the significance of disclosed disciplinary events. The presence or absence of disclosed
        disciplinary history should be evaluated in context, and users are encouraged to review the
        full text of any relevant disclosures directly on{' '}
        <ExtLink href="https://adviserinfo.sec.gov">adviserinfo.sec.gov</ExtLink>.
      </P>
    ),
  },

  /* ── 12 ── */
  {
    id: 'limitation-on-reliance',
    num: '12',
    title: 'Limitation on Reliance',
    content: (
      <>
        <P>
          The Content on this platform is one input among many that users should consider when
          evaluating financial advisory firms. Visor Index strongly recommends that users:
        </P>
        <div className="mt-5">
          <RightRow name="Read filings">
            Review the full Form ADV Parts 1, 2A, and 2B for any firm under consideration
          </RightRow>
          <RightRow name="Interview advisors">
            Conduct direct interviews with prospective advisors
          </RightRow>
          <RightRow name="Review agreements">
            Request and review sample client agreements and fee schedules
          </RightRow>
          <RightRow name="Verify registration">
            Confirm a firm&rsquo;s current registration status on{' '}
            <ExtLink href="https://adviserinfo.sec.gov">adviserinfo.sec.gov</ExtLink>
          </RightRow>
          <RightRow name="Consult professionals">
            Consult with an independent attorney or financial professional as appropriate
          </RightRow>
        </div>
        <P>
          Do not make an advisory engagement decision based solely or primarily on information
          presented on the Visor Index platform.
        </P>
      </>
    ),
  },

  /* ── 13 ── */
  {
    id: 'changes',
    num: '13',
    title: 'Changes to These Disclosures',
    content: (
      <P>
        Visor Index reserves the right to update, amend, or supplement these Disclosures at any
        time. Changes will be effective upon posting, reflected in the updated &ldquo;Last
        Updated&rdquo; date above. Material changes will be communicated to registered users where
        reasonably practicable.
      </P>
    ),
  },

  /* ── 14 ── */
  {
    id: 'contact',
    num: '14',
    title: 'Contact',
    content: (
      <P>
        For questions regarding these Disclosures, please contact us at:{' '}
        <a
          href={`mailto:${EMAIL}`}
          className="text-[#1A7A4A] underline decoration-[#1A7A4A]/30 underline-offset-2 transition-colors hover:text-[#2DBD74]"
        >
          {EMAIL}
        </a>
      </P>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DisclosuresPageClient() {
  return (
    <LegalPageLayout
      title="Disclosures"
      lastUpdated="March 14, 2026"
      intro={
        <>
          The following disclosures are provided by Visor Index in the interest of full transparency
          regarding our regulatory status, data sources, analytical methodologies, commercial
          relationships, and the limitations of the information presented on this platform. These
          disclosures supplement and should be read in conjunction with our{' '}
          <a href="/terms" className="text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/80">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-white/60 underline decoration-white/20 underline-offset-2 transition-colors hover:text-white/80">
            Privacy Policy
          </a>.
        </>
      }
      sections={sections}
      footerQuestion="Questions about our Disclosures?"
      footerEmail="legal@visorindex.com"
    />
  );
}
