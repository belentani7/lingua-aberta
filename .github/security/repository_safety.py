#!/usr/bin/env python3
"""Offline, dependency-free CI safety guard. No credential contents are logged."""
from __future__ import annotations
import re
import subprocess
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
names = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8", "replace").split("\0")
issues = []
sensitive = re.compile(r"(^|/)(\.env($|\.(?!example$|sample$|template$|test$))|id_rsa$|id_ed25519$|.*\.pem$|.*\.p12$|.*\.pfx$|.*\.key$|.*\.keystore$)", re.I)
pattern_groups = [
    re.compile("ghp_" + r"[A-Za-z0-9]{36}"),
    re.compile("github_pat_" + r"[A-Za-z0-9_]{52}"),
    re.compile("AKIA" + r"[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"),
]
for name in filter(None, names):
    path = ROOT / name
    if not path.is_file():
        continue
    if sensitive.search(name) and not name.endswith((".example", ".sample", ".template")):
        issues.append((name, "tracked credential/key file"))
    try:
        if path.stat().st_size > 2_000_000:
            continue
        data = path.read_text("utf-8")
    except (UnicodeError, OSError):
        continue
    if any(p.search(data) for p in pattern_groups):
        issues.append((name, "credential-like signature"))
for name, reason in sorted(set(issues)):
    print("::error file=" + name.replace("%", "%25") + "::" + reason)
print("Repository safety scan complete; issues: " + str(len(set(issues))))
sys.exit(bool(issues))
