package main

import "github.com/charmbracelet/lipgloss"

var (
	cursorStyle   = lipgloss.NewStyle().Background(lipgloss.Color("57")).Foreground(lipgloss.Color("231")).Bold(true)
	selectedStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("213"))
	dirStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("75")).Bold(true)
	mutedStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("241"))
	headerStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("231")).Background(lipgloss.Color("236")).Padding(0, 1)
	statusStyle   = lipgloss.NewStyle().Foreground(lipgloss.Color("117"))
	keyStyle      = lipgloss.NewStyle().Foreground(lipgloss.Color("221")).Bold(true)
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
  e                open in $EDITOR (or $VISUAL, fallback vi)
  /                filter (workspace-wide)
  ?                toggle this help
  q / ctrl+c       quit

filter mode:
  ↑/↓ or ctrl+p/n  move
  enter            commit
  ctrl+y           copy selection
  esc              cancel
`
