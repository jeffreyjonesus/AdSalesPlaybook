#!/usr/bin/env python3
"""Align the report account name with the CRM record, which is "Omega, Inc.".

Idempotent: the negative lookahead means re-running never produces "Inc..".
"""
import pathlib
import re
import sys

PATTERN = re.compile(r"Omega, Inc(?!\.)")
REPLACEMENT = "Omega, Inc."


def main(paths):
    for path in paths:
        p = pathlib.Path(path)
        text = p.read_text(encoding="utf-8")
        text, n = PATTERN.subn(REPLACEMENT, text)
        p.write_text(text, encoding="utf-8")
        print(f"  {p.name:46s} {n:>3} replaced")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
