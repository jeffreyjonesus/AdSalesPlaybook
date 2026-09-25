#!/usr/bin/env python3
"""Drop the simulated Salesforce page chrome from the account wrap report.

The report was authored as a standalone review build, so it draws its own fake
Salesforce shell: a global nav bar, a record highlights panel, a tab strip, a
right-hand account details sidebar, and a toggle bar explaining that "the
component is everything below this line". Embedded in a real Account record
page all of that is duplicated chrome, so the report should render as the bare
component.

The JSX is the source of record and is edited structurally. The HTML is a
minified build artifact, so it gets the smallest equivalent patches instead:
flipping the chrome flag's initial state and hiding the toggle bar with the
stylesheet's existing .hidden rule. Removing minified JSX call expressions by
hand risks unbalancing the bundle for no visual gain.
"""
import pathlib
import sys

JSX_TOGGLE_BAR = '''
      <div className="px-3 py-3 flex items-center gap-2">
        <button onClick={() => setChrome((v) => !v)} className="text-xs px-2 py-1 rounded flex items-center gap-1"
                style={{ border: `1px solid ${C.rule}`, color: C.muted, background: C.card }}>
          <PanelsTopLeft size={12} /> {chrome ? "Hide Salesforce page chrome" : "Show Salesforce page chrome"}
        </button>
        <span className="text-xs" style={{ color: C.muted }}>
          Review build — the component is everything below this line; the surrounding page is context only.
        </span>
      </div>
'''

JSX_EDITS = [
    ("chrome default off",
     "const [chrome, setChrome] = useState(true);",
     "const [chrome, setChrome] = useState(false);"),
    ("remove toggle bar", JSX_TOGGLE_BAR, "\n"),
]

HTML_EDITS = [
    ("chrome default off",
     "[m,y]=(0,Be.useState)(!0)",
     "[m,y]=(0,Be.useState)(!1)"),
    ("hide toggle bar",
     '"px-3 py-3 flex items-center gap-2"',
     '"hidden"'),
]


def main(paths):
    failed = False
    for path in paths:
        p = pathlib.Path(path)
        text = p.read_text(encoding="utf-8")
        edits = JSX_EDITS if p.suffix == ".jsx" else HTML_EDITS
        print(f"\n{p.name}")
        for label, old, new in edits:
            n = text.count(old)
            if n != 1:
                print(f"  !! {label:22s} matched {n} times, expected 1")
                failed = True
                continue
            text = text.replace(old, new)
            print(f"  {label:22s} ok")
        p.write_text(text, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
