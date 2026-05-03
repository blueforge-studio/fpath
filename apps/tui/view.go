package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	cursorStyle    = lipgloss.NewStyle().Background(lipgloss.Color("57")).Foreground(lipgloss.Color("231")).Bold(true)
	selectedStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("213"))
	dirStyle       = lipgloss.NewStyle().Foreground(lipgloss.Color("75")).Bold(true)
	mutedStyle     = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	headerStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("231")).Background(lipgloss.Color("236")).Padding(0, 1)
	statusStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("117"))
	keyStyle       = lipgloss.NewStyle().Foreground(lipgloss.Color("221")).Bold(true)
)

const helpText = `keys:
  j/k or ↓/↑       move cursor
  g / G            top / bottom
  ctrl+d / ctrl+u  jump 10 lines
  h / ←            collapse / parent
  l / → / enter    expand directory
  space            toggle selection
  u                clear selection
  y                copy relative path(s)
  Y                copy absolute path(s)
  /                filter (workspace-wide)
  ?                toggle this help
  q / ctrl+c       quit

filter mode:
  ↑/↓ or ctrl+p/n  move
  enter            commit
  ctrl+y           copy selection
  esc              cancel
`

func (m Model) View() string {
	if m.help {
		return m.renderHelp()
	}

	var b strings.Builder

	// Header
	header := fmt.Sprintf(" fpath  %s ", m.root)
	b.WriteString(headerStyle.Width(m.widthOr(80)).Render(header))
	b.WriteString("\n")

	// Body
	if m.mode == modeFilter {
		b.WriteString(m.renderFilter())
	} else {
		b.WriteString(m.renderTree())
	}

	// Footer
	b.WriteString("\n")
	b.WriteString(m.renderFooter())
	return b.String()
}

func (m Model) widthOr(fallback int) int {
	if m.width > 0 {
		return m.width
	}
	return fallback
}

func (m Model) bodyLines() int {
	// header (1) + filter input (1 if filtering) + footer (1) + buffer
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
				keyStyle.Render("q")+" quit",
		),
	)
	return strings.Join(parts, "  ")
}

func (m Model) renderHelp() string {
	return headerStyle.Width(m.widthOr(80)).Render(" fpath — help ") + "\n\n" +
		helpText + "\n" +
		mutedStyle.Render("press ? to dismiss")
}

// windowAround returns [start, end) indices into a list of `total`
// items such that `cursor` is visible within `lines`. End is exclusive.
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
