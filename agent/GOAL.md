# GOAL

Personal site for Monte Thakkar, in the spirit of sidb.io: minimal,
content-first, blog-led. Lives in the Monte9/Monte9 profile repo and
deploys to Vercel as a static export.

## Pages

- Home: short intro, recent posts
- /about: short personal story (seeded from the profile README facts;
  Monte owns the final copy)
- /posts: index of markdown posts from `content/posts/`
- /posts/[slug]: rendered post pages
- Resume: nav link to `/resume.pdf` (appears automatically once
  `public/resume.pdf` is committed)

## Rules of the road

- Publishing a post = pushing a markdown file to main. No CMS, no backend.
- Static export must stay green (`pnpm build`).
- `README.md` at the repo root is the GitHub profile page. It is NOT part
  of the site and site sprints must never modify it.
- Keep the design minimal: system fonts, generous whitespace, one accent
  color. Content over chrome.
- Don't invent biographical details. Facts come from Monte or from the
  profile README.
