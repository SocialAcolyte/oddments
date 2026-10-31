"""Make @oddments/<piece> packages from the showcase build (which already carries
each piece's CREDITS.md and code LICENSE). Run from this folder."""
import json, os, re, shutil
SHOW = os.path.expanduser("~/StyleFeatures/showcase")
DATA = json.load(open(f"{SHOW}/data.json"))
PIECES = ["hohmann-loader", "pretext-rain", "pretext-burn", "pretext-gloss", "pretext-calligram", "pretext-inscription", "pretext-spiral",
          "drop-cap-gilt", "mimosa-toggle", "chladni-slider", "stitch-type", "details-wheel", "crt-ident", "branch-growth"]
VERSION = "0.1.0"
SITE = "https://socialacolyte.github.io/stylefeatures/"
by = {p["slug"]: p for p in DATA["pieces"]}
for slug in PIECES:
    p, src, dst = by[slug], f"{SHOW}/pieces/{slug}", f"packages/{slug}"
    shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst, ignore=shutil.ignore_patterns(".DS_Store"))
    js, css = f"{slug}.js", f"{slug}.css"
    assert os.path.exists(f"{dst}/{js}") and os.path.exists(f"{dst}/{css}"), slug
    name = re.sub(r"^\w", lambda m: m.group().upper(), slug.replace("-", " "))
    pkg = {
        "name": f"@oddments/{slug}", "version": VERSION, "description": p["blurb"],
        "type": "module", "main": f"./{js}", "module": f"./{js}",
        "exports": {".": f"./{js}", "./style.css": f"./{css}", "./*": "./*"},
        "sideEffects": True, "license": "MIT", "author": "Connor Hood",
        "homepage": f"{SITE}#/{slug}",
        "repository": {"type": "git", "url": "git+https://github.com/SocialAcolyte/oddments.git", "directory": f"packages/{slug}"},
        "keywords": ["oddments", "component", "animation", "canvas", "vanilla-js", "no-build", slug.split("-")[0]],
    }
    json.dump(pkg, open(f"{dst}/package.json", "w"), indent=2, ensure_ascii=False)
    readme = open(f"{dst}/README.md").read()
    code = open(f"{dst}/{js}").read()
    camel = re.sub(r"-(\w)", lambda m: m.group(1).upper(), slug)
    fn = camel if re.search(rf"export (function|const) {camel}\b", code) else re.search(r"export function (\w+)", code).group(1)
    head = f"""# {name}

{p['blurb']}

**[See it live]({SITE}#/{slug})** · part of [Oddments]({SITE}), free web components drawn from paintings, plates, water, cloth and stone.

```sh
npm i @oddments/{slug}
```

```js
import '@oddments/{slug}/style.css';
import {{ {fn} }} from '@oddments/{slug}';   // importing also starts every matching element on the page
```

The markup below is the same as in the download. Where it names a file in `assets/`, use the copy in
the package (with Vite: `import url from '@oddments/{slug}/assets/<file>?url'`), or copy the
`assets/` folder next to your page and keep the paths as they are. The code is MIT; the pictures and sounds keep their own licences,
listed in `CREDITS.md`.

---

"""
    body = re.sub(r"^# .*\n", "", readme, count=1)
    open(f"{dst}/README.md", "w").write(head + body)
    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(dst) for f in fs)
    print(f"{slug:22} {fn:20} {size // 1024:6} KB")
