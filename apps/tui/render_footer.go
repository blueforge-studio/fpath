package main

import (
	"fmt"
	"strings"
)

func (m Model) renderFooter() string {
	parts := []string{}

	switch m.mode {
	case modeBrowse:
		parts = append(parts, mutedStyle.Render("BROWSE"))
	case modeFilter:
		parts = append(parts, mutedStyle.Render("FILTER"))
	}

	selCount := 0
	for _, e := range collectAll(m.tree) {
		if e.Selected {
			selCount++
		}
	}
	if selCount > 0 {
		parts = append(parts, selectedStyle.Render(fmt.Sprintf("%d selected", selCount)))
	}

	if m.allFiles == nil {
		parts = append(parts, mutedStyle.Render("indexing…"))
	} else {
		parts = append(parts, mutedStyle.Render(fmt.Sprintf("%d indexed", len(m.allFiles))))
	}

	if m.status != "" {
		parts = append(parts, statusStyle.Render(m.status))
	}

	parts = append(parts,
		mutedStyle.Render(
			keyStyle.Render("?")+" help · "+
				keyStyle.Render("/")+" filter · "+
				keyStyle.Render("y/Y")+" copy · "+
				keyStyle.Render("e")+" edit · "+
				keyStyle.Render("q")+" quit",
		),
	)
	return strings.Join(parts, "  ")
}
