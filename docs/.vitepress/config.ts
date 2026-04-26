import { defineConfig } from 'vitepress';

const base = process.env.BASE ?? '/';

export default defineConfig({
    base,
    title: 'confused-ai',
    description: 'TypeScript framework for production AI agents — smart defaults, full escape hatches, zero magic',
    lang: 'en-US',

    head: [
        ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
        ['meta', { name: 'theme-color', content: '#8b5cf6' }],
        ['meta', { property: 'og:type', content: 'website' }],
        ['meta', { property: 'og:title', content: 'confused-ai — Build AI Agents That Ship' }],
        ['meta', { property: 'og:description', content: 'TypeScript AI agent framework. Smart defaults, 40+ tools, multi-agent orchestration, production-hardened.' }],
    ],

    themeConfig: {
        logo: { src: '/logo.svg', alt: 'confused-ai' },

        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'All Modules', link: '/guide/all-modules' },
            { text: 'API', link: '/api/' },
            { text: 'Examples', link: '/examples/' },
            {
                text: 'v0.7.0',
                items: [
                    { text: 'Changelog', link: '/changelog' },
                    { text: 'NPM', link: 'https://www.npmjs.com/package/confused-ai' },
                ],
            },
        ],

        sidebar: {
            '/guide/': [
                {
                    text: 'Introduction',
                    items: [
                        { text: 'Getting Started', link: '/guide/getting-started' },
                        { text: 'Core Concepts', link: '/guide/concepts' },
                        { text: '📦 All Modules', link: '/guide/all-modules' },
                    ],
                },
                {
                    text: 'Building Agents',
                    items: [
                        { text: 'Creating Agents', link: '/guide/agents' },
                        { text: 'Built-in Tools', link: '/guide/tools' },
                        { text: 'Custom Tools', link: '/guide/custom-tools' },
                        { text: 'Lifecycle Hooks', link: '/guide/hooks' },
                        { text: 'Compose & Pipe', link: '/guide/compose' },
                    ],
                },
                {
                    text: 'Data & Storage',
                    items: [
                        { text: 'RAG / Knowledge', link: '/guide/rag' },
                        { text: 'Memory', link: '/guide/memory' },
                        { text: 'Storage (KV/File)', link: '/guide/storage' },
                        { text: 'Session Management', link: '/guide/session' },
                        { text: 'Database Tools', link: '/guide/database' },
                    ],
                },
                {
                    text: 'Multi-Agent',
                    items: [
                        { text: 'Orchestration', link: '/guide/orchestration' },
                        { text: 'Execution Workflows', link: '/guide/workflows' },
                    ],
                },
                {
                    text: 'Production',
                    items: [
                        { text: 'Observability', link: '/guide/observability' },
                        { text: 'Guardrails', link: '/guide/guardrails' },
                        { text: 'Resilience', link: '/guide/production' },
                        { text: 'Budget Enforcement', link: '/guide/production#budget-enforcement' },
                        { text: 'Human-in-the-Loop', link: '/guide/hitl' },
                        { text: 'Multi-Tenancy', link: '/guide/multi-tenancy' },
                        { text: 'Background Queues', link: '/guide/background-queues' },
                        { text: 'Voice (TTS/STT)', link: '/guide/voice' },
                        { text: 'MCP Client', link: '/guide/mcp' },
                        { text: 'Plugins', link: '/guide/plugins' },
                    ],
                },
            ],

            '/examples/': [
                {
                    text: 'Playbook',
                    items: [
                        { text: 'Overview', link: '/examples/' },
                        { text: '01 · Hello World', link: '/examples/01-hello-world' },
                        { text: '02 · First Custom Tool', link: '/examples/02-custom-tool' },
                        { text: '03 · Tool with Approval', link: '/examples/03-approval-tool' },
                        { text: '04 · Extend & Wrap Tools', link: '/examples/04-extend-tools' },
                        { text: '05 · RAG Knowledge Base', link: '/examples/05-rag' },
                        { text: '06 · Persistent Memory', link: '/examples/06-memory' },
                        { text: '07 · Storage Patterns', link: '/examples/07-storage' },
                        { text: '08 · Multi-Agent Team', link: '/examples/08-team' },
                        { text: '09 · Supervisor Workflow', link: '/examples/09-supervisor' },
                        { text: '10 · Database Analyst', link: '/examples/10-database' },
                        { text: '11 · Customer Support Bot', link: '/examples/11-support-bot' },
                        { text: '12 · Observability & Hooks', link: '/examples/12-observability' },
                        { text: '13 · Production Resilience', link: '/examples/13-production' },
                        { text: '14 · MCP Filesystem Agent', link: '/examples/14-mcp' },
                        { text: '15 · Full-Stack App', link: '/examples/15-full-stack' },
                        { text: '16 · LLM Router', link: '/examples/16-llm-router' },
                        { text: '17 · Full framework showcase', link: '/examples/17-full-framework-showcase' },
                        { text: '18 · Meridian Platform', link: '/examples/18-meridian-platform' },
                    ],
                },
            ],

            '/api/': [
                {
                    text: 'API Reference',
                    items: [
                        { text: 'Overview', link: '/api/' },
                        { text: 'agent()', link: '/api/agent' },
                        { text: 'tool() / defineTool()', link: '/api/tools' },
                        { text: 'KnowledgeEngine', link: '/api/knowledge' },
                        { text: 'createStorage()', link: '/api/storage' },
                        { text: 'Orchestration', link: '/api/orchestration' },
                    ],
                },
            ],
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/your-org/agent-framework' },
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024-present confused-ai contributors',
        },

        search: { provider: 'local' },

        editLink: {
            pattern: 'https://github.com/your-org/agent-framework/edit/main/docs/:path',
            text: 'Edit this page on GitHub',
        },
    },

    markdown: {
        theme: { light: 'github-light', dark: 'github-dark' },
        lineNumbers: true,
    },
});
