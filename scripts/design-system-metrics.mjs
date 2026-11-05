#!/usr/bin/env node
// Measures how much styling lives outside the primitives. Run before and
// after design-system work: `node scripts/design-system-metrics.mjs`.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

const root = new URL('../src/', import.meta.url).pathname
// Comments quote class names (a debt: disable says which classes it excuses),
// so they're dropped before counting. A `//` after a colon or quote is a URL.
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? walk(p) : [p]
  })

const files = walk(root)
  .filter((f) => /\.(tsx|ts)$/.test(f) && !f.endsWith('.stories.tsx'))
  .filter((f) => !f.includes(`${sep}mock-data${sep}`) && !f.includes(`${sep}stories${sep}`))
  .map((f) => {
    const raw = readFileSync(f, 'utf8')
    return { path: relative(root, f), raw, src: stripComments(raw) }
  })

const isPrimitive = (p) => p.startsWith('components/primitives/')
const isFeature = (p) => p.startsWith('components/') && !isPrimitive(p)
const isPage = (p) => p.startsWith('pages/')

const loc = (fs) => fs.reduce((n, f) => n + f.raw.split('\n').filter((l) => l.trim()).length, 0)
const count = (fs, re) => fs.reduce((n, f) => n + (f.src.match(re) ?? []).length, 0)

// Every string literal that looks like a Tailwind class list.
const classStrings = (src) =>
  [...src.matchAll(/(?:className=|cn\(|['"`])\s*["'`]([a-z0-9:\-\[\]\/\.\s!#%_()]+)["'`]/g)]
    .map((m) => m[1].trim())
    .filter((s) => s.split(/\s+/).length >= 3 && /\b(px|py|p|m|mx|my|text|bg|border|rounded|flex|grid|gap|w|h)-/.test(s))

const consumers = files.filter((f) => isFeature(f.path) || isPage(f.path))
const prims = files.filter((f) => isPrimitive(f.path))
const tokens = new Set()
for (const f of consumers) for (const s of classStrings(f.src)) for (const t of s.split(/\s+/)) tokens.add(t)

const seen = new Map()
for (const f of consumers)
  for (const s of classStrings(f.src)) {
    const k = s.split(/\s+/).sort().join(' ')
    seen.set(k, (seen.get(k) ?? 0) + 1)
  }
const dupes = [...seen.values()].filter((n) => n > 1).reduce((a, n) => a + n, 0)

const primNames = prims.map((f) => f.path.replace(/^components\/primitives\/|\.tsx?$/g, ''))
const primImports = count(consumers, /from ['"]@\/components\/primitives\/[A-Za-z]+['"]/g)

// Palette shades, not the named colours (src/theme/tokens.css) or the brand
// and status scales. White and black with an alpha are allowed.
const rawPalette =
  /\b(?:bg|text|border(?:-[trblxyse])?|ring|outline|divide|fill|stroke|from|to|via|placeholder|shadow|decoration)-(?:(?:gray|red|green|yellow|blue|amber|orange|purple|pink|sky)-\d|(?:white|black)(?![\w/-]))/g

// Colour roles (docs/colour.md "When to add a role"): rising means a new
// role, which is a design decision, so it has to be seen in review.
const tokensCss = readFileSync(join(root, 'theme/tokens.css'), 'utf8')
const roleLines = tokensCss.split('\n').filter((l) => /^\s*--(?:text|background|border|ring|outline)-color-[\w-]+:/.test(l))
const colourRoles = roleLines.length

// The colour rules (docs/colour.md), counted so each falls to 0 and then
// becomes a hard rule. Tests are left out: they assert on colours.
const code = files.filter((f) => !/\.test\.tsx?$/.test(f.path))
const hues = 'gray|red|green|yellow|blue|amber|orange|purple|pink|sky|indigo|primary|white|black|slate|emerald|teal|violet|rose|lime|cyan|fuchsia'
// Any palette class, brand and status scales included, alpha or not.
const anyPalette = new RegExp(
  `\\b(?:bg|text|border(?:-[trblxyse])?|ring|outline|divide|fill|stroke|from|to|via|placeholder|shadow|decoration|caret|accent)-(?:(?:${hues}|danger|success|warning|info|severe)-\\d|(?:white|black)\\b)`,
  'g',
)
// A colour class with an alpha (`bg-surface/80`), or a faded disabled state.
// `text-sm/6` is a size with a line height, not a colour.
const alphaOrFade = /\b(?:bg|text|border|ring|outline|divide|fill|stroke|from|to|via|shadow)-(?!(?:xs|sm|base|lg|[2-9]?xl)\/)[a-z][\w-]*\/\d+|\b(?:[\w-]*disabled:)+opacity-\d+/g
// Hex and rgb() in code; constants.ts (sandbox colours are data) and Monaco (hex only) aside.
// themes.ts' swatches are the picker's preview of each theme.
const codeHex = code
  .filter((f) => !['constants.ts', 'theme/monacoTheme.ts', 'theme/themes.ts'].includes(f.path))
  .reduce((n, f) => n + (f.src.match(/(?:^|[\s(,'"`:])#[0-9a-fA-F]{3,8}\b|rgba?\(/g) ?? []).length, 0)
// A theme setting a palette shade instead of a role.
const themeCss = readFileSync(join(root, 'theme/theme.css'), 'utf8')
const themePalette = (stripComments(themeCss).match(/--color-[a-z]+(?:-\d+)?\s*:/g) ?? []).length
// Tag roles are named for their hue on purpose (docs/colour.md).
const roleNamedForColour = roleLines.filter((l) => !/-color-tag-/.test(l) && new RegExp(`-color-[\\w-]*(?:${hues}|\\d)`).test(l.split(':')[0])).length
const roleWithoutJob = roleLines.filter((l) => !l.includes('/*')).length

// The conventions in PRINCIPLES.md "Conventions", counted so each falls to 0
// and then becomes a lint rule. Existing code is held, not fixed. Fixed sizes
// exclude only the shell; a layout primitive's size is counted and reviewed.
const offSpacing = /(?:^|[\s:"'`])-?(?:p[xytblrse]?|m[xytblrse]?|gap(?:-[xy])?|space-[xy])-(?!(?:0|0\.5|1|1\.5|2|3|4|6|8|px|auto)(?![\d.\w]))[\d.]+\b/g
const offRadius = /\brounded(?:-[tblrse]{1,2})?(?!-(?:md|lg|xl|full)\b)(?:-(?:none|xs|sm|2xl|3xl|4xl))?(?![\w-])/g
const zNumber = /\bz-\d+\b/g
// w-1/2 is a share of the space, not a fixed size; w-3 to w-6 and h-3 to h-6 are icon sizes, like size-3 to size-6.
const fixedSize = /(?:^|[\s:"'`])(?:(?:w|h)-(?![3-6](?![\d.\/]))|(?:min-w|max-w|min-h|max-h)-)(?:[1-9][\d.]*|px)(?![\/\w])|(?:^|[\s:"'`])size-(?![3-6](?![\d.]))[\d.]+(?![\w])/g
const notShell = code.filter((f) => !f.path.startsWith('components/shell/'))
const indexKey = /\bkey=\{(?:i|idx|index)\}/g
const handId = /\bid="[^"]+"/g
const builtClassName = /className=\{`/g
const longFiles = code.filter((f) => f.raw.split('\n').length > 300).length

const rows = [
  ['Source lines (non-blank, excl. stories/mock-data)', loc(files)],
  ['  in primitives', loc(prims)],
  ['  in feature components', loc(files.filter((f) => isFeature(f.path)))],
  ['  in pages', loc(files.filter((f) => isPage(f.path)))],
  ['Primitive files', prims.length],
  ['Feature component files', files.filter((f) => isFeature(f.path)).length],
  ['className= in features + pages', count(consumers, /className=/g)],
  ['Class-list literals in features + pages', consumers.reduce((n, f) => n + classStrings(f.src).length, 0)],
  ['  duplicated (same list used 2+ times)', dupes],
  ['Distinct Tailwind tokens in features + pages', tokens.size],
  ['Arbitrary values (`-[…]`) in features + pages', count(consumers, /-\[[^\]]+\]/g)],
  ['Raw <button> in features + pages', count(consumers, /<button\b/g)],
  ['Raw <input>/<select>/<textarea> in features + pages', count(consumers, /<(input|select|textarea)\b/g)],
  ['Raw <table> in features + pages', count(consumers, /<table\b/g)],
  ['Raw palette classes in features + pages', count(consumers, rawPalette)],
  ['Primitive imports in features + pages', primImports],
  ['debt: lines in src', files.reduce((n, f) => n + (f.raw.match(/\bdebt:/g) ?? []).length, 0)],
  ['Colour roles in theme/tokens.css', colourRoles],
  ['Palette classes in src (any scale, any file)', count(code, anyPalette)],
  ['Colour alpha or faded disabled in src', count(code, alphaOrFade)],
  ['Hex or rgb() in src code', codeHex],
  ['Palette shades set by themes (theme.css)', themePalette],
  ['Colour roles named for a colour or shade', roleNamedForColour],
  ['Colour roles without a job comment', roleWithoutJob],
  ['Spacing off the scale (0, 0.5, 1, 1.5, 2, 3, 4, 6, 8)', count(code, offSpacing)],
  ['Corners other than rounded-md/lg/xl/full', count(code, offRadius)],
  ['z- numbers instead of a named layer', count(code, zNumber)],
  ['Fixed widths or heights outside the shell', count(notShell, fixedSize)],
  ['List keys that are a position', count(code, indexKey)],
  ['Hand-written ids instead of useId()', count(code, handId)],
  ['className built from a template string', count(code, builtClassName)],
  ['Files over 300 lines', longFiles],
]

// The ratchet: these only go down. `--check` (CI) fails when one rises above the
// committed baseline; `--update` writes the new, lower numbers into it.
const ratchet = [
  'className= in features + pages',
  'Class-list literals in features + pages',
  '  duplicated (same list used 2+ times)',
  'Distinct Tailwind tokens in features + pages',
  'Arbitrary values (`-[…]`) in features + pages',
  'Raw <button> in features + pages',
  'Raw <input>/<select>/<textarea> in features + pages',
  'Raw <table> in features + pages',
  'Raw palette classes in features + pages',
  'debt: lines in src',
  'Colour roles in theme/tokens.css',
  'Palette classes in src (any scale, any file)',
  'Colour alpha or faded disabled in src',
  'Hex or rgb() in src code',
  'Palette shades set by themes (theme.css)',
  'Colour roles named for a colour or shade',
  'Colour roles without a job comment',
  'Spacing off the scale (0, 0.5, 1, 1.5, 2, 3, 4, 6, 8)',
  'Corners other than rounded-md/lg/xl/full',
  'z- numbers instead of a named layer',
  'Fixed widths or heights outside the shell',
  'List keys that are a position',
  'Hand-written ids instead of useId()',
  'className built from a template string',
  'Files over 300 lines',
]
const conventions = ratchet.slice(ratchet.indexOf('Spacing off the scale (0, 0.5, 1, 1.5, 2, 3, 4, 6, 8)'))
const baselineFile = new URL('./design-system-baseline.json', import.meta.url)
const now = Object.fromEntries(rows.filter(([k]) => ratchet.includes(k)))
if (process.argv.includes('--update')) {
  writeFileSync(baselineFile, JSON.stringify(now, null, 2) + '\n')
  console.log('Baseline updated.')
  process.exit(0)
}
if (process.argv.includes('--check')) {
  const base = JSON.parse(readFileSync(baselineFile, 'utf8'))
  const up = ratchet.filter((k) => now[k] > base[k])
  const down = ratchet.filter((k) => now[k] < base[k])
  for (const k of up)
    console.error(
      k === 'Colour roles in theme/tokens.css'
        ? `Went up: ${k} ${base[k]} → ${now[k]}. A new colour role needs a human's yes; see "When to add a role" in docs/colour.md.`
        : conventions.includes(k)
          ? `Went up: ${k} ${base[k]} → ${now[k]}. See "Conventions" in PRINCIPLES.md.`
          : `Went up: ${k.trim()} ${base[k]} → ${now[k]}. Use a primitive or prop instead; see docs/building.md.`,
    )
  for (const k of down) console.log(`Went down: ${k.trim()} ${base[k]} → ${now[k]}. Lock it in: node scripts/design-system-metrics.mjs --update`)
  process.exit(up.length ? 1 : 0)
}
const w = Math.max(...rows.map((r) => r[0].length))
if (process.argv.includes('--json')) console.log(JSON.stringify(Object.fromEntries(rows)))
else for (const [k, v] of rows) console.log(`${k.padEnd(w)}  ${v}`)
if (process.argv.includes('--names')) console.log('\nPrimitives:', primNames.join(', '))
