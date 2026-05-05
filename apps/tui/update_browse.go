package main

import (
	"fmt"

	"github.com/atotto/clipboard"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

func (m Model) updateBrowse(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "q", "ctrl+c":
		return m, tea.Quit

	case "?":
		m.help = !m.help

	case "j", "down":
		if m.cursor < len(m.flat)-1 {
			m.cursor++
		}

	case "k", "up":
		if m.cursor > 0 {
			m.cursor--
		}

	case "g":
		m.cursor = 0

	case "G":
		if len(m.flat) > 0 {
			m.cursor = len(m.flat) - 1
		}

	case "ctrl+d":
		m.cursor = clamp(m.cursor+10, 0, len(m.flat)-1)

	case "ctrl+u":
		m.cursor = clamp(m.cursor-10, 0, len(m.flat)-1)

	case "h", "left":
		if e := m.current(); e != nil && e.IsDir && e.Expanded {
			e.Expanded = false
			m.flat = flatten(m.tree)
		} else if e != nil && e.Depth > 0 {
			for i := m.cursor - 1; i >= 0; i-- {
				if m.flat[i].Depth < e.Depth {
					m.cursor = i
					break
				}
			}
		}

	case "l", "right", "enter":
		e := m.current()
		if e == nil || !e.IsDir {
			break
		}
		if e.Children == nil {
			children, err := readDir(e.Path, m.root, e.Depth+1)
			if err != nil {
				m.status = fmt.Sprintf("read failed: %v", err)
				break
			}
			e.Children = children
		}
		e.Expanded = true
		m.flat = flatten(m.tree)

	case " ":
		if e := m.current(); e != nil {
			e.Selected = !e.Selected
		}

	case "u":
		for _, e := range m.flat {
			e.Selected = false
		}
		m.status = "selection cleared"

	case "y":
		count, text := m.copyText(false)
		if count == 0 {
			m.status = "nothing selected"
		} else if err := clipboard.WriteAll(text); err != nil {
			m.status = fmt.Sprintf("clipboard error: %v", err)
		} else {
			m.status = fmt.Sprintf("copied %d relative path(s)", count)
		}

	case "Y":
		count, text := m.copyText(true)
		if count == 0 {
			m.status = "nothing selected"
		} else if err := clipboard.WriteAll(text); err != nil {
			m.status = fmt.Sprintf("clipboard error: %v", err)
		} else {
			m.status = fmt.Sprintf("copied %d absolute path(s)", count)
		}

	case "/":
		m.mode = modeFilter
		m.filter.Reset()
		m.filter.Focus()
		m.cursor = 0
		m.filterRes = nil
		return m, textinput.Blink

	case "e":
		e := m.current()
		if e == nil {
			break
		}
		if e.IsDir {
			m.status = "e: only opens files in $EDITOR"
			break
		}
		m.status = fmt.Sprintf("opening %s in $EDITOR…", e.Name)
		return m, openInEditor(e.Path)

	case "esc":
		m.status = ""
	}
	return m, nil
}
