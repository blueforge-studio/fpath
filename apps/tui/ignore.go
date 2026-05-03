package main

import "strings"

// DefaultIgnore mirrors @fpath/shared/src/ignore.ts.
var DefaultIgnore = []string{
	"node_modules",
	".git",
	"dist",
	".turbo",
	".next",
	"target",
	"__pycache__",
	".DS_Store",
	"Thumbs.db",
}

// shouldIgnore returns true if the given basename matches one of the
// default ignore entries. Patterns containing wildcards (e.g. "*.log")
// are matched by suffix on the literal text after "*".
func shouldIgnore(name string) bool {
	for _, pat := range DefaultIgnore {
		if pat == name {
			return true
		}
	}
	if strings.HasSuffix(name, ".log") {
		return true
	}
	return false
}
