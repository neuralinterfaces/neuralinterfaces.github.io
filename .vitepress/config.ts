import { defineConfig, createContentLoader } from 'vitepress';
import path from 'node:path'
import { writeFileSync } from 'node:fs'
import { Feed } from 'feed'

import { formatPageContentForRSS } from './theme/utils';

const siteTitle = 'Neural Interfaces';
const siteDescription = 'The Catalog of Brain-Responsive Applications';
const blogDir = 'posts';

const hostName = 'https://neuralinterfaces.com';
const author = [
  {
    name: 'Garrett Flynn',
    email: 'garrettmflynn@gmail.com',
    link: `garrettflynn.com`
  }
]

const siteCopyright = 'Copyright © 2024-present Garrett Flynn';

const formattedPagesForRSS: Record<string, string> = {};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'en-US',
  title: siteTitle,
  description: siteDescription,

  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  appearance: false,

  themeConfig: {

    nav: [
      { text: 'Home', link: '/' },
      // { text: 'Blog', link: `/${blogDir}/` },
      { text: 'Team', link: '/team' }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/neuralinterfaces' },
    ],

    footer: {
      copyright: siteCopyright
    }
  },

  transformHtml(_code, _id, { content, pageData }) {
    const { filePath } = pageData;
    const dirname = path.dirname(filePath);
    const basename = path.basename(filePath, '.md');

    if (dirname === blogDir) {
      const html = formatPageContentForRSS(content, hostName);
      if (html) {
        formattedPagesForRSS[`/${dirname}/${basename}`] = html;
      }
    }
  },


  buildEnd: async (config) => {

    const feed = new Feed({
      title: siteTitle,
      description: siteDescription,
      id: hostName,
      link: hostName,
      copyright: siteCopyright,
      language: 'en',
    });

    // Load data from all the blog markdown files, sorted by date
    const posts = await createContentLoader(`/${blogDir}/*.md`, {
      render: true,
      includeSrc: true,
      transform(rawData) {
        return rawData.sort((a, b) => {
          return +new Date(b.frontmatter.date).getTime() - +new Date(a.frontmatter.date).getTime()
        });
      }
    }).load();

    for (const { url, excerpt, frontmatter, html } of posts) {

      if (frontmatter.status === 'draft') continue;

      const improvedHtml = formattedPagesForRSS[url];

      feed.addItem({
        title: frontmatter.title,
        id: `${hostName}${url}`,
        link: `${hostName}${url}`,
        description: excerpt,
        content: improvedHtml || html,
        author,
        date: frontmatter.date
      });
    }

    writeFileSync(path.join(config.outDir, 'feed.rss'), feed.rss2());
  }

})
