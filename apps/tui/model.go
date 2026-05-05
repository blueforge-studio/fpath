package main

import (
	"fmt"

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
	tree      []*Entry        // top-level entries
	flat      []*Entry        // current visible flat list (in browse mode)
	cursor    int             // index into flat (or filterRes in filter mode)
	mode      mode
	filter    textinput.Model
	filterRes []*Entry        // matches when in filter mode
	allFiles  []*Entry        // workspace-wide flat file index for filter mode
	indexErr  error
	status    string          // transient bottom-line message
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

	case editorFinishedMsg:
		if msg.err != nil {
			m.status = fmt.Sprintf("editor error: %v", msg.err)
		} else {
			m.status = "editor closed"
		}
		return m, nil

	case tea.KeyMsg:
		if m.mode == modeFilter {
			return m.updateFilter(msg)
		}
		return m.updateBrowse(msg)
	}
	return m, nil
}
