package main

import (
	"fmt"
	"strings"
)

func (m Model) renderTree() string {
	if len(m.flat) == 0 {
		return mutedStyle.Render("(empty)")
	}
	var b strings.Builder
	maxLines := m.bodyLines()
	start, end := windowAround(m.cursor, len(m.flat), maxLines)
	for i := start; i < end; i++ {
		b.WriteString(renderEntry(m.flat[i], i == m.cursor))
		b.WriteString("\n")
	}
	return b.String()
}

func renderEntry(e *Entry, isCursor bool) string {
	pad := strings.Repeat("  ", e.Depth)
	glyph := " "
	if e.IsDir {
		if e.Expanded {
			glyph = "▾"
		} else {
			glyph = "▸"
		}
	}
	check := "  "
	if e.Selected {
		check = "✔ "
	}
	icon := "📄"
	if e.IsDir {
		icon = "📁"
	}
	name := e.Name
	if e.IsDir {
		name = dirStyle.Render(name)
	} else if e.Selected {
		name = selectedStyle.Render(name)
	}
	row := fmt.Sprintf("%s%s %s%s %s", pad, glyph, check, icon, name)
	if isCursor {
		return cursorStyle.Render(row)
	}
	return row
}
