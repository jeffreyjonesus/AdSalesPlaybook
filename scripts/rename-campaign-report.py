#!/usr/bin/env python3
"""Align the campaign wrap report with the records already in the org.

The mock was authored against "Omega Motors" owned by "Jordan Avery"; the CRM
account is "Omega, Inc." and the other two reports name the seller "Jennifer
Smith". Only these two literals move. The 26 bare "Omega" references are prose
shorthand ("Omega's linear buy", "Omega AOR") that already read correctly
against the full name, and unlike the account report this one derives no
display strings from the company name, so there is no prefix to repair.
"""

import pathlib
import sys

EDITS = [
    ("account name", "Omega Motors", "Omega, Inc."),
    ("campaign owner", "Jordan Avery", "Jennifer Smith"),
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
        for stale in ("Omega Motors", "Jordan", "Avery"):
            if stale in text:
                print(f"  !! '{stale}' still present")
                failed = True
        p.write_text(text, encoding="utf-8")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
