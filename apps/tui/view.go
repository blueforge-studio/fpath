package main

import (
	"fmt"
	"strings"
)

func (m Model) View() string {
	if m.help {
		return m.renderHelp()
	}

	var b strings.Builder

	header := fmt.Sprintf(" fpath  %s ", m.root)
	b.WriteString(headerStyle.Width(m.widthOr(80)).Render(header))
	b.WriteString("\n")

	if m.mode == modeFilter {
		b.WriteString(m.renderFilter())
	} else {
		b.WriteString(m.renderTree())
	}

	b.WriteString("\n")
	b.WriteString(m.renderFooter())
	return b.String()
}

func (m Model) renderHelp() string {
	return headerStyle.Width(m.widthOr(80)).Render(" fpath — help ") + "\n\n" +
		helpText + "\n" +
		mutedStyle.Render("press ? to dismiss")
}

func (m Model) widthOr(fallback int) int {
	if m.width > 0 {
		return m.width
	}
	return fallback
}

func (m Model) bodyLines() int {
	used := 3
	if m.mode == modeFilter {
		used++
	}
	if m.height <= 0 {
		return 30
	}
	if m.height-used < 5 {
		return 5
	}
	return m.height - used
}

// windowAround returns [start, end) indices into a list of `total` items
// such that `cursor` is visible within `lines`. End is exclusive.
func windowAround(cursor, total, lines int) (int, int) {
	if total <= lines {
		return 0, total
	}
	start := cursor - lines/2
	if start < 0 {
		start = 0
	}
	end := start + lines
	if end > total {
		end = total
		start = end - lines
	}
	return start, end
}
