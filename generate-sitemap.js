const { SitemapStream, streamToPromise } = require('sitemap');
const { createWriteStream } = require('fs');
const path = require('path');

// Base URL of the website
const hostname = 'https://sairamncc.in';

// List of pages to include in the sitemap
const pages = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/about-ncc', changefreq: 'monthly', priority: 0.8 },
    { url: '/anos', changefreq: 'monthly', priority: 0.8 },
    { url: '/achievements', changefreq: 'weekly', priority: 0.9 },
    { url: '/alumni', changefreq: 'monthly', priority: 0.7 },
    { url: '/events', changefreq: 'weekly', priority: 0.9 },
    { url: '/reports', changefreq: 'monthly', priority: 0.7 },
    { url: '/wing/army', changefreq: 'monthly', priority: 0.8 },
    { url: '/wing/navy', changefreq: 'monthly', priority: 0.8 },
    { url: '/wing/airforce', changefreq: 'monthly', priority: 0.8 },
    { url: '/gallery', changefreq: 'weekly', priority: 0.8 },
    { url: '/contact', changefreq: 'monthly', priority: 0.6 }
];

async function generateSitemap() {
    try {
        const smStream = new SitemapStream({ hostname });
        const writeStream = createWriteStream(path.join(__dirname, 'public', 'sitemap.xml'));

        smStream.pipe(writeStream);

        pages.forEach(page => {
            smStream.write(page);
        });

        smStream.end();

        const sitemap = await streamToPromise(smStream);
        console.log('Sitemap generated successfully!');
    } catch (error) {
        console.error('Error generating sitemap:', error);
    }
}

generateSitemap();
