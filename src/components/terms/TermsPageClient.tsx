'use client';

import { LegalPageLayout, P, UL, LI, type LegalSection } from '@/components/legal/LegalPageLayout';

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

const sections: LegalSection[] = [
  {
    id: 'about',
    num: '01',
    title: 'About Visor Index',
    content: (
      <>
        <P>
          Visor Index is an independent data and analytics platform that aggregates, analyzes,
          and presents information about SEC-registered investment advisory firms. Our mission is
          to provide individual investors with objective, data-driven tools to research, compare,
          and evaluate registered investment advisers (&ldquo;RIAs&rdquo;).
        </P>
        <P>
          Visor Index is not a registered investment adviser, broker-dealer, financial planner, or
          fiduciary. We do not manage assets, execute transactions, or provide individualized
          investment advice.
        </P>
      </>
    ),
  },
  {
    id: 'not-investment-advice',
    num: '02',
    title: 'Not Investment Advice',
    callout: true,
    content: (
      <>
        <P>
          The information, data, scores, analyses, rankings, and content available on Visor Index
          (collectively, &ldquo;Content&rdquo;) are provided for informational and comparative
          purposes only. Nothing on this platform constitutes investment advice, financial advice,
          legal advice, tax advice, or any other form of professional advice.
        </P>
        <P>
          Selecting a financial adviser is a significant financial decision. The Content provided
          by Visor Index is intended to supplement&thinsp;&mdash;&thinsp;not replace&thinsp;&mdash;&thinsp;your
          own independent research, due diligence, and where appropriate, consultation with
          licensed professionals. You should carefully evaluate any advisory firm, their Form ADV
          filings, fee structures, investment strategies, and disciplinary history before making
          any engagement decision. Visor Index strongly encourages users to read a firm&rsquo;s
          full Form ADV Parts 1, 2A, and 2B prior to entering into any advisory relationship.
        </P>
        <P>
          No Content on this platform should be construed as a recommendation to hire, retain, or
          avoid any specific investment advisory firm or financial professional.
        </P>
      </>
    ),
  },
  {
    id: 'visor-value-score',
    num: '03',
    title: 'The Visor Index Score',
    callout: true,
    content: (
      <>
        <P>
          The Visor Index Score (&ldquo;Score&rdquo;) is a proprietary analytical framework
          developed by Visor Index for comparative purposes only. The Score is designed to
          facilitate relative comparisons among SEC-registered advisory firms across a defined set
          of quantitative and qualitative criteria.
        </P>
        <P>
          The Visor Index Score is not a guarantee, prediction, or assurance of any outcome. A
          higher Score does not guarantee that a firm will deliver superior investment returns,
          provide better client service, act in your best interest, or be an appropriate match for
          your individual circumstances. A lower Score does not indicate that a firm is deficient,
          unsuitable, or to be avoided.
        </P>
        <P>
          The Score is one analytical input among many. Users should not make advisory selection
          decisions based solely or primarily on the Score. Visor Index expressly disclaims any
          liability for decisions made in reliance on the Score.
        </P>
        <P>
          The methodology underlying the Score is subject to change at Visor Index&rsquo;s sole
          discretion and without prior notice. Past Score values are not necessarily indicative of
          current or future assessments.
        </P>
      </>
    ),
  },
  {
    id: 'data-sources',
    num: '04',
    title: 'Data Sources and Accuracy',
    content: (
      <>
        <P className="mt-6 font-semibold text-[#0a1c2a]">4.1 &mdash; Self-Reported Data</P>
        <P>
          A substantial portion of the data presented on Visor Index is sourced from Form ADV
          filings submitted by investment advisory firms directly to the U.S. Securities and
          Exchange Commission (&ldquo;SEC&rdquo;) via the Investment Adviser Registration
          Depository (&ldquo;IARD&rdquo;). This data is self-reported by the advisory firms
          themselves and is not independently verified or audited by Visor Index.
        </P>
        <P>
          Visor Index makes no representations or warranties regarding the accuracy,
          completeness, timeliness, or reliability of self-reported data. Firms may submit
          inaccurate, incomplete, or outdated information to the SEC, and such errors may be
          reflected in our platform without our knowledge.
        </P>

        <div className="my-6 border-l-2 border-[#2DBD74] bg-[#edf0ef] py-5 pl-6 pr-5">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#2DBD74]">
            Important Notice
          </p>
          <P className="text-[15px]">
            <strong>4.2 &mdash; Artificial Intelligence and Machine Learning.</strong> Certain
            Content on the Visor Index platform&thinsp;&mdash;&thinsp;including but not limited to
            summaries, analyses, firm characterizations, and derived metrics&thinsp;&mdash;&thinsp;is
            generated in whole or in part using large language models (&ldquo;LLMs&rdquo;) and
            other artificial intelligence or machine learning systems.
          </P>
          <P className="text-[15px]">
            AI-generated content is subject to error, including
            &ldquo;hallucinations&rdquo;&thinsp;&mdash;&thinsp;instances where an AI system
            produces information that is plausible in appearance but factually incorrect,
            incomplete, or misleading. Visor Index does not warrant the accuracy of any
            AI-generated Content and expressly cautions users not to treat AI-generated summaries
            or analyses as authoritative statements of fact. Users should independently verify any
            material information before relying upon it.
          </P>
        </div>

        <P className="mt-6 font-semibold text-[#0a1c2a]">4.3 &mdash; Third-Party Data</P>
        <P>
          Visor Index may incorporate data from third-party sources. We do not independently
          verify third-party data and make no representations regarding its accuracy or
          completeness. Third-party data is subject to the terms and conditions of the respective
          data providers.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">4.4 &mdash; No Real-Time Data Guarantee</P>
        <P>
          Filings, firm information, and regulatory data are updated periodically and may not
          reflect the most current information available. Visor Index does not guarantee that data
          presented on the platform is current as of the date of your access.
        </P>
      </>
    ),
  },
  {
    id: 'commercial-relationships',
    num: '05',
    title: 'Commercial Relationships and Conflicts of Interest',
    content: (
      <>
        <P className="mt-2 font-semibold text-[#0a1c2a]">5.1 &mdash; Current Status</P>
        <P>
          As of the date last updated above, Visor Index does not receive compensation, referral
          fees, revenue sharing, or any other form of payment from investment advisory firms,
          financial intermediaries, or their affiliates in connection with the data, scores,
          rankings, or recommendations displayed on the platform. Our revenue is derived solely
          from user subscriptions.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">5.2 &mdash; Future Changes</P>
        <P>
          This policy may change in the future. Visor Index reserves the right to enter into
          commercial relationships with advisory firms or third parties, which could include
          sponsored placements, advertising, data licensing, or referral arrangements. In the
          event of any such material change, Visor Index will update these Terms, revise the date
          above, and make commercially reasonable efforts to disclose the nature of such
          relationships to users, including clear labeling of sponsored or commercially influenced
          content.
        </P>
        <P>
          Users are advised to review these Terms periodically for updates. Continued use of the
          Service following any such update constitutes acceptance of the revised Terms.
        </P>

        <P className="mt-6 font-semibold text-[#0a1c2a]">5.3 &mdash; No Guaranteed Independence</P>
        <P>
          While Visor Index endeavors to maintain editorial objectivity, we cannot guarantee that
          all Content will be free from bias, error, or commercial influence. Users should
          evaluate Content critically and independently.
        </P>
      </>
    ),
  },
  {
    id: 'no-investment-management',
    num: '06',
    title: 'No Investment Management Services',
    content: (
      <>
        <P>
          Visor Index is not registered as an investment adviser under the Investment Advisers Act
          of 1940, nor as a broker-dealer under the Securities Exchange Act of 1934. Visor Index
          does not:
        </P>
        <UL>
          <LI>Manage, advise on, or have discretion over any investment assets;</LI>
          <LI>Execute or facilitate securities transactions on behalf of users;</LI>
          <LI>Hold, custody, or safeguard user assets;</LI>
          <LI>Act as a fiduciary to any user.</LI>
        </UL>
        <P>
          Any information on this platform regarding investment strategies, asset allocation, or
          portfolio construction is general and educational in nature and does not constitute
          personalized investment management services.
        </P>
      </>
    ),
  },
  {
    id: 'user-responsibilities',
    num: '07',
    title: 'User Responsibilities',
    content: (
      <>
        <P>
          You agree to use the Service only for lawful purposes and in accordance with these
          Terms. You agree not to:
        </P>
        <UL>
          <LI>
            Use the Content for commercial redistribution, resale, or republication without prior
            written consent from Visor Index;
          </LI>
          <LI>Scrape, harvest, or systematically download data from the platform;</LI>
          <LI>Represent Visor Index data as your own proprietary research;</LI>
          <LI>
            Rely on the Service as your sole basis for any investment or advisory engagement
            decision.
          </LI>
        </UL>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    num: '08',
    title: 'Intellectual Property',
    content: (
      <P>
        All Content, scoring methodologies, software, design, trademarks, and other intellectual
        property on the Visor Index platform are the property of Visor Index or its licensors and
        are protected by applicable intellectual property laws. Unauthorized use is strictly
        prohibited.
      </P>
    ),
  },
  {
    id: 'disclaimer-of-warranties',
    num: '09',
    title: 'Disclaimer of Warranties',
    legalCaps: true,
    content: (
      <P>
        THE SERVICE AND ALL CONTENT ARE PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS
        AVAILABLE&rdquo; WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
        LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY,
        COMPLETENESS, OR NON-INFRINGEMENT. VISOR INDEX DOES NOT WARRANT THAT THE SERVICE WILL BE
        UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
      </P>
    ),
  },
  {
    id: 'limitation-of-liability',
    num: '10',
    title: 'Limitation of Liability',
    legalCaps: true,
    content: (
      <>
        <P>
          TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, VISOR INDEX AND ITS OFFICERS,
          DIRECTORS, EMPLOYEES, AFFILIATES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO
          LOSS OF PROFITS, LOSS OF DATA, OR FINANCIAL LOSSES ARISING FROM YOUR USE OF OR RELIANCE
          ON THE SERVICE OR CONTENT, EVEN IF VISOR INDEX HAS BEEN ADVISED OF THE POSSIBILITY OF
          SUCH DAMAGES.
        </P>
        <P className="normal-case">
          In no event shall Visor Index&rsquo;s total cumulative liability to you exceed the
          greater of (i) the amount you paid to Visor Index in the twelve months preceding the
          claim, or (ii) one hundred dollars ($100).
        </P>
      </>
    ),
  },
  {
    id: 'indemnification',
    num: '11',
    title: 'Indemnification',
    content: (
      <P>
        You agree to indemnify, defend, and hold harmless Visor Index and its officers, directors,
        employees, and agents from and against any claims, liabilities, damages, losses, and
        expenses, including reasonable attorneys&rsquo; fees, arising out of or in any way
        connected with your access to or use of the Service, your violation of these Terms, or
        your reliance on any Content in connection with any financial or advisory decision.
      </P>
    ),
  },
  {
    id: 'regulatory-compliance',
    num: '12',
    title: 'Regulatory Compliance',
    content: (
      <>
        <P>
          Visor Index is not affiliated with, endorsed by, or acting on behalf of the SEC, FINRA,
          or any other regulatory authority. The availability of regulatory filing data on this
          platform does not imply any regulatory endorsement of Visor Index or its Content.
        </P>
        <P>
          Users are responsible for complying with all applicable laws and regulations in their
          jurisdiction in connection with their use of the Service.
        </P>
      </>
    ),
  },
  {
    id: 'modifications',
    num: '13',
    title: 'Modifications to Terms',
    content: (
      <P>
        Visor Index reserves the right to modify these Terms at any time. Changes will be
        effective upon posting to the platform with an updated &ldquo;Last Updated&rdquo; date.
        Your continued use of the Service constitutes acceptance of the modified Terms. We
        encourage you to review these Terms periodically.
      </P>
    ),
  },
  {
    id: 'governing-law',
    num: '14',
    title: 'Governing Law and Dispute Resolution',
    content: (
      <P>
        These Terms shall be governed by and construed in accordance with the laws of the State of
        Delaware, without regard to conflict of law principles. Any dispute arising under these
        Terms shall be subject to the exclusive jurisdiction of the state and federal courts
        located in New York County, New York.
      </P>
    ),
  },
  {
    id: 'contact',
    num: '15',
    title: 'Contact',
    content: (
      <P>
        For questions regarding these Terms, please contact us at:{' '}
        <a
          href="mailto:legal@visorindex.com"
          className="text-[#1A7A4A] underline decoration-[#1A7A4A]/30 underline-offset-2 transition-colors hover:text-[#2DBD74]"
        >
          legal@visorindex.com
        </a>
      </P>
    ),
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function TermsPageClient() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="March 13, 2026"
      intro={
        <>
          Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the
          Visor Index platform, website, or any associated services. By accessing or using the
          Service, you agree to be bound by these Terms.
        </>
      }
      sections={sections}
      footerQuestion="Questions about our Terms?"
      footerEmail="legal@visorindex.com"
    />
  );
}
