import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// The design-system rules in CLAUDE.md, as lint. An exception is disabled on
// its line with a reason, so the reason is reviewed with it:
// `// eslint-disable-next-line no-restricted-syntax -- <why>`. A reason that
// starts `debt:` is one we mean to fix: `grep -rn "debt:" src` lists them.
const offScale = 'neutral scale is gray-*, brand is primary-*. See CLAUDE.md, Matching Lightning.'
const designRules = [
  {
    selector: 'Literal[value=/\\b(slate|zinc|indigo|neutral|stone|secondary)-\\d/]',
    message: `Off-palette colour: the ${offScale}`,
  },
  {
    selector: 'TemplateElement[value.raw=/\\b(slate|zinc|indigo|neutral|stone|secondary)-\\d/]',
    message: `Off-palette colour: the ${offScale}`,
  },
  {
    selector:
      // `w-[3ch]`, not a variant like `has-[td]:`.
      ':matches(JSXAttribute[name.name=/[cC]lassName$/], CallExpression[callee.name="cn"]) :matches(Literal[value=/-\\[[^\\]]*\\](?!:)/], TemplateElement[value.raw=/-\\[[^\\]]*\\](?!:)/])',
    message:
      "Arbitrary Tailwind value: use Tailwind's scale. Real geometry (a diagram, a chart) is the exception; disable it with a reason.",
  },
]

// Colours are named for what they're for (src/theme/tokens.css). Each message
// names what to use instead. White and black with an alpha (`black/5`,
// `white/10`) are allowed: they tint whatever is behind them.
const WB = '(?:white|black)(?![\\w\\x2f-])'
const UTIL = '(?:bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|divide|fill|stroke|from|to|via|placeholder|shadow|decoration|caret|accent)'
const OTHER = ['amber', 'orange', 'purple', 'pink', 'sky', 'teal', 'emerald', 'lime', 'cyan', 'violet', 'fuchsia', 'rose']
const banned = (re, message) => [
  { selector: `Literal[value=/${re}/]`, message },
  { selector: `TemplateElement[value.raw=/${re}/]`, message },
]
const tokens = 'See src/theme/tokens.css.'
const colourRules = ({ palette = true, literals = true, amber = false } = {}) => [
  ...(palette
    ? [
        ...banned(
          `\\btext-(?:gray-\\d|${WB})`,
          `Raw text colour: use text-strong (gray-900/800), text-body (700), text-muted (600/500), text-faint (400/300), text-code (on bg-code) or text-inverse (white). ${tokens}`
        ),
        ...banned(
          `\\bbg-(?:gray-\\d|${WB})`,
          `Raw background: use bg-surface (white), bg-subtle (gray-50), bg-hover (gray-50, hover on white), bg-page or bg-sunken (100), bg-emphasis (200/300), bg-code (700), bg-inverse (800) or bg-overlay. ${tokens}`
        ),
        ...banned(
          `\\b(?:border(?:-[trblxyse])?|divide|ring|outline)-(?:gray-\\d|${WB})`,
          `Raw border colour: use border-subtle (gray-100/200), border-strong (300) or border-emphasis (400/500). divide-* and ring-* take the same names; focus is outline-focus or ring-focus. ${tokens}`
        ),
        ...banned(
          `\\b${UTIL}-(?:red|green|yellow|blue)-\\d`,
          'Raw status colour: keep the shade and use the status name: red is danger, green is success, yellow is warning, blue is info (bg-red-50 becomes bg-danger-50).'
        ),
        ...banned(
          `\\b${UTIL}-(?:${OTHER.filter((f) => !amber || f !== 'amber').join('|')})-\\d|\\b(?:fill|stroke|from|to|via|placeholder|shadow|decoration)-(?:gray-\\d|${WB})`,
          `Raw palette colour: a tag takes a Pill colour, a run state comes from src/theme/runStateColours.ts, and a chart keeps its palette in its own allow-listed file. Icons take fill-current or stroke-current with a text-* name; placeholders take placeholder:text-faint. ${tokens}`
        ),
      ]
    : []),
  ...(literals
    ? banned(
        '(?:^|[\\s(,\\[:])#[0-9a-fA-F]{3,8}\\b|rgba?\\(|--color-(?:gray|red|green|yellow|blue|white|black)\\b',
        `Colour literal: use a named colour class, or its variable in a style (var(--text-color-muted), var(--background-color-surface)). A canvas or Monaco value that copies Lightning is disabled on its line with the reason. ${tokens}`
      )
    : []),
]

// Pages and feature components compose primitives (src/components/*.tsx).
const rawControl = {
  selector: 'JSXOpeningElement[name.name=/^(button|input|select|textarea|table)$/]',
  message:
    'Raw control: use Button, IconButton, the Inputs controls or Table. If this element deliberately is not that control, disable it with a reason.',
}

const srcRules = (colours) => ['error', ...designRules, ...colours, liveViewAttribute]
const consumerRules = (colours) => [...srcRules(colours), rawControl]

// Every eslint-disable says why, after ` -- `, so a reviewer can judge it.
const local = {
  rules: {
    'disable-needs-reason': {
      meta: { type: 'suggestion', messages: { missing: 'Say why: `eslint-disable-next-line <rule> -- <reason>`.' } },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (/^\s*eslint-disable/.test(comment.value) && !/\s--\s/.test(comment.value)) {
                context.report({ loc: comment.loc, messageId: 'missing' })
              }
            }
          },
        }
      },
    },
  },
}

const routerMessage = 'Navigate through useRouter() and Link from src/routing/router.'
const routerImports = [
  { name: 'react-router-dom', message: routerMessage },
  { name: 'react-router', message: routerMessage },
]

// The replica's models (src/mock-data/models/) are its own records. Contract
// shapes are written by hand in src/types/ and the replica maps the models
// onto them, so a fixture change can't change a contract (STANDARDS §11).
const modelImports = {
  group: ['**/mock-data/models', '**/mock-data/models/**'],
  message: "Models are the replica's records: take a hand-written contract shape from src/types/ (STANDARDS §11).",
}
const mockDataImports = {
  // Any other mock-data path: models get their own message.
  regex: '(^|/)mock-data(/(?!models(/|$)).*)?$',
  message: 'Take data as props; the replica loads it. Types live in src/types/, helpers in src/utils/.',
}
const sessionImports = {
  group: ['**/session', '**/session/**'],
  message: 'Take the user and permissions as props; the replica reads the session.',
}

// The design system runs outside Lightning too (the replica, Storybook), so it
// can't lean on LiveView or the browser URL. URLs go through src/routing.
const hostMessage = 'Design-system code must not depend on LiveView or the browser URL; use useRouter() from src/routing/router.'
const liveViewAttribute = {
  selector: 'JSXAttribute[name.name=/^phx-/]',
  message: `phx- attribute: ${hostMessage}`,
}

export default defineConfig([
  globalIgnores(['dist', 'storybook-static', 'compare-out']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    linterOptions: { reportUnusedDisableDirectives: 'error' },
    plugins: { local },
    rules: { 'local/disable-needs-reason': 'error' },
  },
  {
    // Stories set fixed canvas sizes, so they're left out.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx'],
    rules: { 'no-restricted-syntax': srcRules(colourRules()) },
  },
  {
    files: ['src/pages/**/*.tsx', 'src/components/*/**/*.tsx'],
    ignores: ['**/*.stories.tsx'],
    rules: { 'no-restricted-syntax': consumerRules(colourRules()) },
  },
  // Raw palette colours, confined to the files that are about colour.
  // Tag colours:
  { files: ['src/components/Pill.tsx'], rules: { 'no-restricted-syntax': srcRules(colourRules({ palette: false })) } },
  // The theme files and the run-state map:
  { files: ['src/theme/**/*.{ts,tsx}'], rules: { 'no-restricted-syntax': srcRules([]) } },
  // Monaco's theme, the sandbox colours (user data) and the health charts' palette:
  {
    files: ['src/components/monacoTheme.ts', 'src/constants.ts', 'src/components/projects/health/palette.ts'],
    rules: { 'no-restricted-syntax': srcRules(colourRules({ literals: false })) },
  },
  // Chart palettes:
  {
    files: ['src/components/history/ChannelTiming.tsx', 'src/components/admin/LiveDashboardHome.tsx'],
    rules: { 'no-restricted-syntax': consumerRules([]) },
  },
  // Tests and fixtures hold data (sandbox colours) and query chart classes:
  { files: ['src/**/*.test.{ts,tsx}', 'src/mock-data/**/*.{ts,tsx}'], rules: { 'no-restricted-syntax': srcRules([]) } },
  {
    files: ['src/pages/**/*.test.tsx', 'src/components/*/**/*.test.tsx'],
    rules: { 'no-restricted-syntax': consumerRules([]) },
  },
  // Stories are checked for colour too. Hex stays allowed: it is data there (sandbox colours, chart values).
  { files: ['src/**/*.stories.tsx'], rules: { 'no-restricted-syntax': ['error', ...colourRules({ literals: false })] } },
  { files: ['src/components/Menu.stories.tsx'], rules: { 'no-restricted-syntax': ['error', ...colourRules({ literals: false, amber: true })] } },
  // The amber notices (support user, experimental):
  {
    files: ['src/components/shell/UserMenu.tsx', 'src/components/shell/Sidebar.tsx'],
    rules: { 'no-restricted-syntax': consumerRules(colourRules({ amber: true })) },
  },
  {
    // The router adapter is the one place that reads the browser URL.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/routing/**'],
    rules: {
      'no-restricted-globals': ['error', { name: 'location', message: hostMessage }],
      'no-restricted-properties': [
        'error',
        { object: 'window', property: 'location', message: hostMessage },
        { object: 'document', property: 'location', message: hostMessage },
        { property: 'pushEvent', message: hostMessage },
        { property: 'pushEventTo', message: hostMessage },
      ],
    },
  },
  {
    // Annotations navigate through the router adapter too.
    files: ['src/annotations/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': ['error', { paths: routerImports }] },
  },
  {
    // The data seam: components, pages and utils get records and permission
    // booleans as props (the wiring loads them), so wiring the backend only
    // touches `*.replica.*` files and `*Replica.ts` helpers. Stories may use
    // fixtures. An import that still crosses the seam says why, with
    // `-- wiring: …` (it stays) or `-- debt: …` (page not yet split).
    files: ['src/components/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}', 'src/utils/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx', '**/*[rR]eplica.{ts,tsx}', '**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: routerImports,
          patterns: [modelImports, mockDataImports, sessionImports],
        },
      ],
    },
  },
  {
    // Contract shapes are written by hand, never built on models or fixtures.
    files: ['src/types/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: [modelImports, mockDataImports] }] },
  },
])
