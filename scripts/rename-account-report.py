#!/usr/bin/env python3
"""Rebrand the account wrap report from Northwind Motors to Omega, Inc.

The full company name is replaced before the bare given name so "Northwind
Motors" does not first become "Omega Motors". The website is lowercase and so
survives the capitalised passes; it needs its own rule. The trailing bare-name
pass also catches possessives ("Northwind's") and the React component
identifier (NorthwindAccountWrap).
"""
import pathlib
import sys

EDITS = [
    ("company name", "Northwind Motors", "Omega, Inc"),
    ("website", "northwindmotors.com", "omega.com"),
    ("account owner", "Jordan Avery", "Jennifer Smith"),
    ("bare name, possessives", "Northwind", "Omega"),
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
            print(f"  {label:24s} {n:>3} replaced")
        for stale in ("Northwind", "northwind", "Jordan", "Avery"):
            if stale in text:
                print(f"  !! '{stale}' still present")
                failed = True
        p.write_text(text, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
