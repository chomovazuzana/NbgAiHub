// site/astro.config.mjs
//
// Astro 6 + Starlight 0.39 configuration for NbgAiHub.
// See docs/design/project-design.md §S.6.1 for the contract.

import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  // CLAUDE.md → Ports: dev server pinned to 4321.
  // CLI flag `--port 4322` is the escape hatch on collision (don't edit this).
  server: { port: 4321, host: false },

  integrations: [
    starlight({
      title: 'NbgAiHub',
      description: 'A field manual for newcomers to Claude Code.',
      customCss: ['./src/styles/custom.css'],
      components: {
        // R6: override Starlight's SocialIcons slot (not the whole Header) to
        // host the sign-in affordance + signed-in chip + global SignInModal.
        SocialIcons: './src/components/SocialIconsOverride.astro',
      },
      sidebar: [
        { label: 'Home', link: '/' },
        { label: 'My Pins', link: '/my-pins/' },
        {
          label: 'Start Here',
          collapsed: false,
          items: [
            { label: 'Day 1', link: '/start-here/day-1/' },
            { label: 'Week 1 (coming soon)', link: '/start-here/week-1/' },
          ],
        },
        { label: 'News', link: '/news/' },
        { label: 'Skills', link: '/skills/' },
        { label: 'Tips & Tricks', link: '/tips/' },
        { label: 'Glossary', link: '/glossary/' },
        { label: 'Reference', link: '/reference/' },
        {
          label: 'Contribute',
          collapsed: false,
          items: [
            { label: 'How to contribute', link: '/contribute/' },
            { label: 'Submit a Skill', link: '/submit-skill/' },
          ],
        },
      ],
    }),
  ],
});
