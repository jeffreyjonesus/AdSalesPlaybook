#!/usr/bin/env python3
"""Rename the Northwind Motors advertiser to Omega, Inc across the report sources.

The campaign display name is derived from the first whitespace-delimited token of
the advertiser name, so an advertiser containing a comma needs the token trimmed
or every campaign renders as "Omega, <campaign>".
"""
import pathlib
import sys

OLD = "Northwind Motors"
NEW = "Omega, Inc"

# (description, literal, replacement) applied in order to every target file.
EDITS = [
    ("advertiser name", OLD, NEW),
    ("possessive prose", "Northwind's", "Omega's"),
    ("renewal callout", "Lead the Northwind and", "Lead the Omega and"),
    # JSX source form
    ("display prefix (source)",
     'name: `${c.a.split(" ")[0]} ${c.n}`',
     'name: `${c.a.split(" ")[0].replace(/,$/, "")} ${c.n}`'),
    # minified bundle form
    ("display prefix (bundle)",
     'name:`${e.a.split(" ")[0]} ${e.n}`',
     'name:`${e.a.split(" ")[0].replace(/,$/,"")} ${e.n}`'),
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
            print(f"  {label:26s} {n:>3} replaced")
        leftover = text.count("Northwind")
        if leftover:
            print(f"  !! {leftover} 'Northwind' references remain")
            failed = True
        p.write_text(text, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
