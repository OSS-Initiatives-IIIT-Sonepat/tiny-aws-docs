import { site } from "@/lib/landing/site";
import { getSiteUrl } from "@/lib/site-url";

const url = getSiteUrl();

const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${url}/#website`,
      url,
      name: site.name,
      description: site.description,
      inLanguage: "en",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${url}/#app`,
      name: site.name,
      url,
      description: site.description,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Linux",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      license: "https://opensource.org/licenses/MIT",
      sameAs: [site.repo.url],
    },
    {
      "@type": "SoftwareSourceCode",
      "@id": `${url}/#source`,
      name: site.name,
      codeRepository: site.repo.url,
      programmingLanguage: ["Go", "Rust", "C++"],
      license: "https://opensource.org/licenses/MIT",
      targetProduct: { "@id": `${url}/#app` },
    },
  ],
};

export function StructuredData() {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
