package main

import "strings"

func (m Model) current() *Entry {
	if m.cursor < 0 || m.cursor >= len(m.flat) {
		return nil
	}
	return m.flat[m.cursor]
}

func (m Model) currentInFilter() *Entry {
	if m.cursor < 0 || m.cursor >= len(m.filterRes) {
		return nil
	}
	return m.filterRes[m.cursor]
}

// copyText returns (count, joined text). If absolute is false, uses RelPath.
// If nothing is selected, falls back to the entry under the cursor.
func (m Model) copyText(absolute bool) (int, string) {
	var paths []string
	for _, e := range collectAll(m.tree) {
		if e.Selected {
			if absolute {
				paths = append(paths, e.Path)
			} else {
				paths = append(paths, e.RelPath)
			}
		}
	}
	if len(paths) == 0 {
		var e *Entry
		if m.mode == modeFilter {
			e = m.currentInFilter()
		} else {
			e = m.current()
		}
		if e == nil {
			return 0, ""
		}
		if absolute {
			paths = []string{e.Path}
		} else {
			paths = []string{e.RelPath}
		}
	}
	return len(paths), strings.Join(paths, "\n")
}

func collectAll(nodes []*Entry) []*Entry {
	out := []*Entry{}
	var walk func([]*Entry)
	walk = func(es []*Entry) {
		for _, e := range es {
			out = append(out, e)
			if e.Children != nil {
				walk(e.Children)
			}
		}
	}
	walk(nodes)
	return out
}

func clamp(v, lo, hi int) int {
	if v < lo {
		return lo
	}
	if v > hi {
		return hi
	}
	return v
}
