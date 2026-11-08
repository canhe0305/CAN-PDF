# CANS workspace prototype

Base: Stirling-PDF `046f1a0e7163fae43ad9b687fdd1c697f05dda8d` (independent checkout).

## Visual direction

- Canvas `#ededeb`, paper `#fdfdfc`, ink `#252724`, muted `#818580`, accent `#3f4843`, selection `#e5e8e4`.
- Windows Segoe UI Variable / Microsoft YaHei UI; macOS system / PingFang SC. Use the document's own typography within the PDF.
- Empty workspace: quiet CANS wordmark, centered opening action and drop target. No dashboard, promotional artwork or permanent footer.
- Open document: compact filename and file actions at the top; document tools centered beneath; optional thumbnails at left and context settings at right. The scrolling PDF is clipped below controls.
- Retain the upstream document state, tool operations, history, rendering and resource cleanup. Adapt the workspace composition around those APIs.

```
CANS       document.pdf                           Open  Save
                Read  Edit  Annotate    Zoom
 thumbnails |               PDF                  | properties
```

## Review against the accepted brief

The user's accepted CANS layout determines the palette and hierarchy. No new decorative system is needed. Document controls remain reachable without obscuring the PDF. The first prototype earns its scope by opening, modifying, undoing, saving and reopening real files.

## First acceptance boundary

Start with the MIT core; do not build from the upstream licensed desktop/processor/cloud layers. Keep runtime dependencies and service requirements visible in the developer report. Browser downloads must not be described as confirmed native file saves. A Windows/macOS desktop release follows independent platform adaptation and verification.
