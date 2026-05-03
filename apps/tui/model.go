package main

import (
	"fmt"
	"strings"

	"github.com/atotto/clipboard"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
)

type mode int

const (
	modeBrowse mode = iota
	modeFilter
)

// Model is the Bubble Tea state for fpath TUI.
type Model struct {
	root      string
	tree      []*Entry           // top-level entries
	flat      []*Entry           // current visible flat list (in browse mode)
	cursor    int                // index into flat (or filterRes in filter mode)
	mode      mode
	filter    textinput.Model
	filterRes []*Entry           // matches when in filter mode
	allFiles  []*Entry           // workspace-wide flat file index for filter mode
	indexErr  error
	status    string             // transient bottom-line message
	width     int
	height    int
	help      bool
}

// NewModel constructs the initial model.
func NewModel(root string) (Model, error) {
	top, err := readDir(root, root, 0)
	if err != nil {
		return Model{}, fmt.Errorf("read %s: %w", root, err)
	}

	ti := textinput.New()
	ti.Placeholder = "filter files…"
	ti.Prompt = "/ "
	ti.CharLimit = 200

	m := Model{
		root:   root,
		tree:   top,
		filter: ti,
		mode:   modeBrowse,
	}
	m.flat = flatten(m.tree)
	return m, nil
}

// Init implements tea.Model.
func (m Model) Init() tea.Cmd {
	return func() tea.Msg {
		files, err := walkAll(m.root)
		return indexLoadedMsg{files: files, err: err}
	}
}

type indexLoadedMsg struct {
	files []*Entry
	err   error
}

// Update implements tea.Model.
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
		return m, nil

	case indexLoadedMsg:
		m.allFiles = msg.files
		m.indexErr = msg.err
		return m, nil

	case tea.KeyMsg:
		if m.mode == modeFilter {
			return m.updateFilter(msg)
		}
		return m.updateBrowse(msg)
	}
	return m, nil
}

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
			// Move cursor to parent
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
		// unselect all
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

	case "esc":
		m.status = ""
	}
	return m, nil
}

func (m Model) updateFilter(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "esc":
		m.mode = modeBrowse
		m.filter.Blur()
		m.filterRes = nil
		m.cursor = 0
		return m, nil

	case "enter":
		// Lock in: stay in browse mode at the selected file (if any)
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
	const max = 200
	out := make([]*Entry, 0, max)
	for _, e := range m.allFiles {
		if strings.Contains(strings.ToLower(e.Name), q) ||
			strings.Contains(strings.ToLower(e.RelPath), q) {
			out = append(out, e)
			if len(out) >= max {
				break
			}
		}
	}
	return out
}

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

// copyText returns (count, joined text). If absolute is false, uses
// RelPath. If nothing is selected, falls back to the entry under the
// cursor.
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
