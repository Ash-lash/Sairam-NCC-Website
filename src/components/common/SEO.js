import React from 'react';
import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SEO = ({ title, description, image, url, type = 'website', noindex = false, keywords }) => {
    const siteName = 'SAIRAM NATIONAL CADET CORPS';
    const defaultDescription = 'Official website of National Cadet Corps (NCC) at Sri Sairam Engineering College, Chennai. Building character, discipline, and leadership since 2003.';
    const defaultImage = '/ncc-favicon.png';

    const metaDescription = description || defaultDescription;
    const metaImage = image || defaultImage;
    const metaTitle = (title && title !== siteName) ? `${title} | ${siteName}` : siteName;

    const defaultKeywords = "Sairam NCC, NCC Sairam, Sri Sairam Engineering College NCC, National Cadet Corps, NCC Chennai, Sairam Engineering College, NCC Army Wing, NCC Navy Wing, NCC Air Wing";
    const metaKeywords = keywords ? `${keywords}, ${defaultKeywords}` : defaultKeywords;

    return (
        <Helmet>
            {/* Standard Metadata */}
            <title>{metaTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="keywords" content={metaKeywords} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:site_name" content={siteName} />
            <meta property="og:title" content={metaTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:image" content={metaImage} />
            {url && <meta property="og:url" content={url} />}

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={metaTitle} />
            <meta name="twitter:description" content={metaDescription} />
            <meta name="twitter:image" content={metaImage} />

            {/* Noindex for Admin Pages */}
            {noindex && <meta name="robots" content="noindex, nofollow" />}

            {/* Canonical Link */}
            <link rel="canonical" href={`https://sairamncc.in${window.location.pathname}`} />

            {/* JSON-LD Structured Data for Google Rich Results */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "WebSite",
                    "name": "SAIRAM NATIONAL CADET CORPS",
                    "alternateName": ["Sairam National Cadet Corps", "NCC Sairam", "Sairam NCC", "Sri Sairam Engineering College NCC"],
                    "url": "https://sairamncc.in/",
                    "potentialAction": {
                        "@type": "SearchAction",
                        "target": "https://sairamncc.in/search?q={search_term_string}",
                        "query-input": "required name=search_term_string"
                    }
                })}
            </script>
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "SAIRAM NATIONAL CADET CORPS",
                    "url": "https://sairamncc.in/",
                    "logo": "https://sairamncc.in/ncc-favicon.png",
                    "sameAs": [
                        "https://www.instagram.com/sairam_ncc/"
                    ]
                })}
            </script>
        </Helmet>
    );
};

SEO.propTypes = {
    title: PropTypes.string,
    description: PropTypes.string,
    image: PropTypes.string,
    url: PropTypes.string,
    type: PropTypes.string,
    noindex: PropTypes.bool,
    keywords: PropTypes.string,
};

export default SEO;
