package main

import (
	"fmt"
	"strings"
)

func (m Model) renderFilter() string {
	var b strings.Builder
	b.WriteString(m.filter.View())
	b.WriteString("\n")
	if len(m.filterRes) == 0 {
		if m.filter.Value() == "" {
			b.WriteString(mutedStyle.Render("type to search the workspace…"))
		} else {
			b.WriteString(mutedStyle.Render("(no matches)"))
		}
		return b.String()
	}
	maxLines := m.bodyLines() - 1
	start, end := windowAround(m.cursor, len(m.filterRes), maxLines)
	for i := start; i < end; i++ {
		e := m.filterRes[i]
		marker := " "
		if e.Selected {
			marker = "✔"
		}
		line := fmt.Sprintf(" %s %s  %s", marker, e.Name, mutedStyle.Render(e.RelPath))
		if i == m.cursor {
			line = cursorStyle.Render(line)
		} else if e.Selected {
			line = selectedStyle.Render(line)
		}
		b.WriteString(line)
		b.WriteString("\n")
	}
	return b.String()
}
