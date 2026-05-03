package main

import (
	"os"
	"path/filepath"
	"sort"
	"strings"
)

// Entry represents a file or directory in the tree.
type Entry struct {
	Name     string
	Path     string // absolute
	RelPath  string // relative to workspace root
	IsDir    bool
	Depth    int
	Children []*Entry // nil = not yet loaded for directories
	Expanded bool
	Selected bool
}

// readDir lists the immediate children of a directory and returns
// freshly constructed *Entry values. Directories come first, then files,
// each group sorted alphabetically.
func readDir(dirPath, workspaceRoot string, depth int) ([]*Entry, error) {
	entries, err := os.ReadDir(dirPath)
	if err != nil {
		return nil, err
	}

	out := make([]*Entry, 0, len(entries))
	for _, de := range entries {
		name := de.Name()
		if shouldIgnore(name) {
			continue
		}
		full := filepath.Join(dirPath, name)
		rel, _ := filepath.Rel(workspaceRoot, full)
		out = append(out, &Entry{
			Name:    name,
			Path:    full,
			RelPath: rel,
			IsDir:   de.IsDir(),
			Depth:   depth,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].IsDir != out[j].IsDir {
			return out[i].IsDir
		}
		return strings.ToLower(out[i].Name) < strings.ToLower(out[j].Name)
	})
	return out, nil
}

// flatten walks the visible tree (only descending into expanded dirs)
// and returns a flat slice for cursor/render purposes.
func flatten(roots []*Entry) []*Entry {
	out := []*Entry{}
	var walk func([]*Entry)
	walk = func(es []*Entry) {
		for _, e := range es {
			out = append(out, e)
			if e.IsDir && e.Expanded && e.Children != nil {
				walk(e.Children)
			}
		}
	}
	walk(roots)
	return out
}

// walkAll walks the entire tree under root (respecting shouldIgnore) and
// returns a flat list of files, used by the / filter mode so it spans
// the whole workspace, not just expanded dirs.
func walkAll(root string) ([]*Entry, error) {
	out := []*Entry{}
	err := filepath.WalkDir(root, func(path string, d os.DirEntry, err error) error {
		if err != nil {
			return nil // skip on permission errors etc.
		}
		if d.Type()&os.ModeSymlink != 0 {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		name := d.Name()
		if shouldIgnore(name) && path != root {
			if d.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		if d.IsDir() {
			return nil
		}
		rel, _ := filepath.Rel(root, path)
		out = append(out, &Entry{
			Name:    name,
			Path:    path,
			RelPath: rel,
			IsDir:   false,
		})
		return nil
	})
	return out, err
}
