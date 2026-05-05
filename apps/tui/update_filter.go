package main

import (
	"fmt"
	"strings"

	"github.com/atotto/clipboard"
	tea "github.com/charmbracelet/bubbletea"
)

const filterMaxResults = 200

func (m Model) updateFilter(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.mode = modeBrowse
		m.filter.Blur()
		m.filterRes = nil
		m.cursor = 0
		return m, nil

	case "enter":
		if e := m.currentInFilter(); e != nil {
			m.status = fmt.Sprintf("found: %s", e.RelPath)
		}
		m.mode = modeBrowse
		m.filter.Blur()
		return m, nil

	case "down", "ctrl+n":
		if m.cursor < len(m.filterRes)-1 {
			m.cursor++
		}
		return m, nil

	case "up", "ctrl+p":
		if m.cursor > 0 {
			m.cursor--
		}
		return m, nil

	case " ":
		if e := m.currentInFilter(); e != nil {
			e.Selected = !e.Selected
		}
		return m, nil

	case "ctrl+y":
		count, text := m.copyText(false)
		if count == 0 {
			m.status = "nothing selected"
		} else if err := clipboard.WriteAll(text); err != nil {
			m.status = fmt.Sprintf("clipboard error: %v", err)
		} else {
			m.status = fmt.Sprintf("copied %d relative path(s)", count)
		}
		return m, nil
	}

	var cmd tea.Cmd
	m.filter, cmd = m.filter.Update(msg)
	q := strings.ToLower(strings.TrimSpace(m.filter.Value()))
	if q == "" {
		m.filterRes = nil
		m.cursor = 0
	} else {
		res := m.searchIndex(q)
		m.filterRes = res
		if m.cursor >= len(res) {
			m.cursor = 0
		}
	}
	return m, cmd
}

func (m Model) searchIndex(q string) []*Entry {
	out := make([]*Entry, 0, filterMaxResults)
	for _, e := range m.allFiles {
		if strings.Contains(strings.ToLower(e.Name), q) ||
			strings.Contains(strings.ToLower(e.RelPath), q) {
			out = append(out, e)
			if len(out) >= filterMaxResults {
				break
			}
		}
	}
	return out
}
