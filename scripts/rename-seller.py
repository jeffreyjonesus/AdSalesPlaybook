#!/usr/bin/env python3
"""Rename the seller of record from Jordan Avery to Jennifer Smith.

Order matters: the full name is replaced before the bare given name so that
"Jordan Avery" does not first become "Jennifer Avery". The uppercase constant is
untouched by the bare-name pass and is handled separately; it exists only in the
JSX source, since the bundled HTML has it minified away.
"""
import pathlib
import sys

EDITS = [
    ("full name", "Jordan Avery", "Jennifer Smith"),
    ("given name", "Jordan", "Jennifer"),
    ("attainment constant", "JORDAN_ATTAIN", "JENNIFER_ATTAIN"),
]


def main(paths):
    failed = False
    for path in paths:
        p = pathlib.Path(path)
        text = p.read_text(encoding="utf-8")
        print(f"\n{p.name}")
        for label, old, new in EDITS:
            n = text.count(old)
            if n:
                text = text.replace(old, new)
            print(f"  {label:22s} {n:>3} replaced")
        for stale in ("Jordan", "Avery", "JORDAN"):
            if stale in text:
                print(f"  !! '{stale}' still present")
                failed = True
        p.write_text(text, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
