package main

import (
	"fmt"
	"os"
	"os/exec"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
)

type editorFinishedMsg struct {
	err error
}

// openInEditor returns a tea.Cmd that suspends Bubble Tea, runs $VISUAL /
// $EDITOR (falling back to vi) on the given path, and resumes the TUI.
func openInEditor(path string) tea.Cmd {
	editor := firstNonEmpty(os.Getenv("VISUAL"), os.Getenv("EDITOR"), "vi")
	parts := strings.Fields(editor)
	if len(parts) == 0 {
		return func() tea.Msg {
			return editorFinishedMsg{err: fmt.Errorf("empty editor command")}
		}
	}
	args := append(parts[1:], path)
	cmd := exec.Command(parts[0], args...)
	return tea.ExecProcess(cmd, func(err error) tea.Msg {
		return editorFinishedMsg{err: err}
	})
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}
