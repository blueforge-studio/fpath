package main

import (
	"flag"
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
)

func main() {
	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "fpath — terminal file browser\n\n")
		fmt.Fprintf(os.Stderr, "Usage: %s [path]\n\n", os.Args[0])
		fmt.Fprintf(os.Stderr, "If no path is given, the current directory is used.\n")
		flag.PrintDefaults()
	}
	flag.Parse()

	root, err := os.Getwd()
	if err != nil {
		fmt.Fprintln(os.Stderr, "failed to read cwd:", err)
		os.Exit(1)
	}
	if flag.NArg() > 0 {
		root = flag.Arg(0)
	}
	abs, err := filepath.Abs(root)
	if err != nil {
		fmt.Fprintln(os.Stderr, "bad path:", err)
		os.Exit(1)
	}
	info, err := os.Stat(abs)
	if err != nil {
		fmt.Fprintln(os.Stderr, "stat failed:", err)
		os.Exit(1)
	}
	if !info.IsDir() {
		fmt.Fprintf(os.Stderr, "%s is not a directory\n", abs)
		os.Exit(1)
	}

	model, err := NewModel(abs)
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}

	prog := tea.NewProgram(model, tea.WithAltScreen(), tea.WithMouseCellMotion())
	if _, err := prog.Run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
