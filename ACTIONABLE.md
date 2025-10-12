# **Obsidian Geff — Standalone Production Plugin (Latest Version)**

> **Tujuan**: Bangun plugin Obsidian bernama **Obsidian Geff**, terinspirasi Harpoon, untuk berpindah antar catatan menggunakan _slot_ dan _workspace_, dengan penyimpanan persisten berbasis JSON. Plugin **standalone**, tanpa integrasi plugin lain, dan menggunakan **versi terbaru semua dependency, API, dan standar Obsidian**.

---

## 1. General Requirements

- **TypeScript terbaru** (versi stabil terbaru saat ini).
- **Obsidian API terbaru** (sesuai rilis resmi terbaru).
- Struktur modular: `src/core/`, `src/ui/`, `src/storage/`, `src/utils/`, `src/types/`.
- ESLint + Prettier terbaru.
- Testing framework: **Jest terbaru**.
- Kompatibel desktop & mobile Obsidian versi terbaru (minimal v1.5.0+, update ke versi stabil terbaru).
- Versioning: **semver terbaru** (`v0.1.0 → v1.0.0`).
- CI/CD: GitHub Actions terbaru (build, test, release).

---

## 2. Core System

- Daftar catatan aktif (max 9 slot).
- Tambah, hapus, dan navigasi antar slot instan.
- Semua perubahan disimpan di **JSON plugin versi terbaru**.
- Backup otomatis setiap perubahan JSON.
- Urutan slot tetap.
- Validasi duplikasi note.
- Undo satu langkah terakhir (add/remove).
- Sinkronisasi state antar sesi (persist vault).

---

## 3. Workspace Management

- Multi-workspace support.
- Buat, hapus, rename, switch workspace aktif.
- Simpan workspace aktif di JSON (`activeWorkspaceId`).
- Ekspor/impor workspace (`.json`).
- Timestamp `createdAt` & `updatedAt`.
- Validasi nama unik.
- Indikator workspace aktif di status bar.
- Migrasi schema otomatis saat update plugin.

---

## 4. File Event Handling

- Deteksi rename/delete/move file di vault.
- Update path otomatis bila file berpindah.
- Hapus entri dari list atau tandai _missing_ bila file dihapus.
- Validasi keberadaan file setiap kali workspace dibuka.
- Auto-recover jika vault dipindah/diubah.

---

## 5. UI / UX

- Quick Menu popup menampilkan slot (1–9).
- Navigasi keyboard (angka, panah, enter, esc).
- Klik/klik kanan untuk menu kontekstual (Remove, Open, Reveal).
- Tombol “Add Current Note” di toolbar/status bar.
- Status bar: workspace aktif + jumlah slot.
- Tema mengikuti dark/light mode Obsidian terbaru.
- Notifikasi via _Notice_ untuk add/remove/error.
- Full keyboard workflow; optional drag & drop.
- Multi-bahasa UI (EN/ID).
- Tab Settings khusus plugin.

---

## 6. Commands & Hotkeys

- Command Palette internal plugin:
  - Add note
  - Remove note
  - Open Quick Menu
  - Goto Slot 1–9
  - Create/Rename/Delete/Switch workspace
  - Export/Import workspace

- Hotkey default:
  - `Ctrl/Cmd + Shift + A` → Add note
  - `Ctrl/Cmd + E` → Open Quick Menu
  - `Ctrl/Cmd + 1..9` → Jump to slot

- Dukungan custom hotkey via Settings.

---

## 7. Data Management & Reliability

- JSON schema versioned terbaru (`schemaVersion: 1`).
- Validasi data setiap load/save.
- Backup otomatis (`geff_backup_YYYYMMDD.json`).
- Recovery otomatis bila JSON rusak.
- Fallback ke workspace default jika data hilang.
- Optimistic locking untuk hindari konflik.
- Kompres JSON jika ukuran terlalu besar.

---

## 8. Settings & Customization

- Toggle auto-remove file hilang.
- Toggle backup otomatis.
- Path penyimpanan data.
- Tema UI (default/compact/minimal).
- Bahasa UI (EN/ID).
- Slot maksimal (default 9).
- Reset konfigurasi (factory reset).
- Toggle notifikasi.
- Konfirmasi hapus file.
- Telemetry opt-in.

---

## 9. Safety & Integrity

- Validasi JSON sebelum tulis.
- Deteksi file hilang & opsi perbaikan.
- Konfirmasi tindakan destruktif.
- Auto-fix path bila file dipindah.
- Semua data lokal, tidak upload.
- Backup anti-korupsi otomatis.
- Konfirmasi overwrite workspace existing.

---

## 10. Testing & QA

- Unit test: add/remove/goto note.
- Test rename/delete/move file.
- Test validasi schema JSON.
- Test migrasi versi data.
- Test ekspor/impor workspace.
- Test recovery dari file corrupt.
- Integration test dalam dummy vault.
- QA manual semua fitur utama.

---

## 11. Developer & Distribution

- Publikasi ke Obsidian Community Plugins.
- Lengkapi `manifest.json`, `README.md`, `CHANGELOG.md`.
- Sertakan screenshot & demo GIF.
- GitHub repo publik dengan issue label standar.
- Sistem i18n multi-bahasa.
- Kompatibilitas minimal Obsidian v1.5.0+, update ke versi stabil terbaru.

---

## 12. Roadmap (Next Steps)

- Multi-note per slot (group slot).
- Kolom komentar/label per slot.
- Workspace otomatis berdasarkan folder.
- Session mode untuk catatan sementara.
- Custom theme Quick Menu.
- Contextual shortcut per workspace.
- Mobile gesture support.
- Workspace sharing antar user.
- Statistik lokal penggunaan note.

---

### Prompt Pengembangan

> “Bangun plugin **Obsidian Geff** dengan semua fitur di atas, **standalone**, menggunakan versi terbaru **TypeScript, Obsidian API, JSON storage, ESLint/Prettier, Jest**, dan CI/CD GitHub Actions.
> Fokus pada reliabilitas, UX cepat, dan semua alur data internal plugin, tanpa integrasi plugin lain.”

---

# **Blueprint Arsitektur: Obsidian Geff**

## 1. **Struktur Folder**

```
obsidian-geff/
├── manifest.json          # Metadata plugin untuk Obsidian
├── package.json           # NPM package info & dependencies
├── tsconfig.json          # TypeScript config
├── README.md              # Dokumentasi & instruksi
├── CHANGELOG.md           # Catatan perubahan versi
├── .eslintrc.js           # ESLint config
├── .prettierrc            # Prettier config
├── .github/workflows/     # CI/CD GitHub Actions
├── src/
│   ├── main.ts            # Entry point plugin
│   ├── core/              # Logika inti plugin
│   │   ├── pluginManager.ts  # Init plugin, lifecycle hooks (onload, onunload)
│   │   ├── workspaceManager.ts # CRUD workspace, switch, rename
│   │   ├── slotManager.ts      # CRUD slot, jump, undo
│   │   ├── dataManager.ts      # Load/save JSON, backup, schema validation
│   │   └── eventHandler.ts     # File/folder rename/delete/move events
│   ├── ui/                # Semua UI plugin
│   │   ├── quickMenu.ts       # Quick menu popup & keyboard navigation
│   │   ├── statusBar.ts       # Status bar widget (workspace + slot count)
│   │   ├── notice.ts          # Wrapper untuk Obsidian Notice
│   │   └── settingsTab.ts     # Plugin settings UI
│   ├── types/             # TypeScript types/interfaces
│   │   ├── workspace.ts       # Workspace type
│   │   ├── slot.ts            # Slot type
│   │   └── geff.ts            # Global types
│   ├── utils/             # Helper functions
│   │   ├── validation.ts      # JSON & data validation
│   │   ├── backup.ts          # Backup & recovery helpers
│   │   ├── keyboard.ts        # Keyboard shortcuts utilities
│   │   └── constants.ts       # Fixed constants (max slots, default workspace)
└── test/                  # Unit & integration tests
    ├── core/
    ├── ui/
    └── integration/
```

---

## 2. **Modul Utama & Tanggung Jawab**

| Modul                 | Tanggung Jawab                                                                |
| --------------------- | ----------------------------------------------------------------------------- |
| `pluginManager.ts`    | Lifecycle plugin (`onload`, `onunload`), register commands & hotkeys          |
| `workspaceManager.ts` | CRUD workspace, switch workspace, rename/delete, timestamp, activeWorkspaceId |
| `slotManager.ts`      | CRUD slot (add/remove), jump to slot, undo, validasi duplikat, max 9 slot     |
| `dataManager.ts`      | Load/save JSON, backup otomatis, recovery, schema validation, fallback        |
| `eventHandler.ts`     | File/folder rename/delete/move detection, auto-update path, auto-recover      |
| `quickMenu.ts`        | Popup slot menu, keyboard nav, click & right-click actions                    |
| `statusBar.ts`        | Tampilkan workspace aktif & slot count di status bar                          |
| `settingsTab.ts`      | UI untuk plugin settings (toggle, theme, language, max slot, telemetry)       |
| `notice.ts`           | Wrapper untuk menampilkan feedback user (add/remove/error)                    |
| `utils/validation.ts` | Validasi JSON schema & slot/workspace                                         |
| `utils/backup.ts`     | Backup JSON, recovery otomatis, compress/restore data                         |
| `utils/keyboard.ts`   | Hotkey utilities, map keyboard shortcuts untuk slot & commands                |
| `utils/constants.ts`  | Max slots, default workspace, default settings constants                      |

---

## 3. **Alur Lifecycle Plugin**

1. **Load Plugin (`onload`)**
   - Inisialisasi `pluginManager`.
   - Load data JSON melalui `dataManager`.
   - Inisialisasi `workspaceManager` & `slotManager`.
   - Daftarkan **commands** ke Command Palette.
   - Daftarkan **hotkeys** default dan custom.
   - Render **status bar** & register Quick Menu.
   - Register **file/folder event listener** (`eventHandler`).

2. **Aktifkan Plugin**
   - Workspace aktif ditentukan (`activeWorkspaceId`).
   - Slot di-load & di-sync.
   - Quick Menu siap untuk navigasi keyboard & klik.
   - UI settings bisa diakses.

3. **Event Handling**
   - Detect file/folder rename → update slot paths.
   - Detect file delete → hapus/tandai _missing_.
   - Undo slot add/remove.
   - Backup JSON setiap perubahan.

4. **Save / Persist**
   - `slotManager` + `workspaceManager` → update JSON melalui `dataManager`.
   - Backup otomatis dibuat.
   - Validasi schema setiap save.

5. **Unload Plugin (`onunload`)**
   - Deregister semua hotkeys & commands.
   - Deregister event listener.
   - Hapus UI elements (status bar, quick menu).
   - Flush any pending JSON save/backup.

---

## 4. **Alur Data JSON**

**File:** `geff_data.json`

```json
{
  "schemaVersion": 1,
  "activeWorkspaceId": "workspace_1",
  "workspaces": [
    {
      "id": "workspace_1",
      "name": "Catatan Sekolah",
      "createdAt": "2025-10-12T11:00:00Z",
      "updatedAt": "2025-10-12T11:15:00Z",
      "slots": [
        { "id": "slot_1", "notePath": "notes/math.md" },
        { "id": "slot_2", "notePath": "notes/science.md" }
      ]
    },
    {
      "id": "workspace_2",
      "name": "Keuangan",
      "createdAt": "2025-10-12T11:05:00Z",
      "updatedAt": "2025-10-12T11:20:00Z",
      "slots": []
    }
  ]
}
```

**Flow Data:**

1. Plugin load → `dataManager.load()` → parse JSON → validasi schema.
2. Workspace aktif → `workspaceManager.setActive()` → slotManager.loadSlots().
3. Add/remove slot → `slotManager.update()` → `dataManager.save()` → auto backup.
4. File rename/delete → `eventHandler.updatePaths()` → `dataManager.save()`.
5. Export/Import workspace → `workspaceManager.exportJSON()` / `importJSON()`.

---

## 5. **Command & Hotkey Mapping**

**Note**: semua hotkey bersifat fully adjustable melalui Settings plugin.

| Command          | Hotkey Default   | Modul            |
| ---------------- | ---------------- | ---------------- |
| Add Current Note | Ctrl/Cmd+Shift+A | slotManager      |
| Remove Note      | Ctrl/Cmd+Shift+R | slotManager      |
| Open Quick Menu  | Ctrl/Cmd+E       | quickMenu        |
| Goto Slot 1..9   | Ctrl/Cmd+1..9    | slotManager      |
| Create Workspace | Ctrl/Cmd+Shift+N | workspaceManager |
| Switch Workspace | Ctrl/Cmd+Shift+S | workspaceManager |
| Rename Workspace | Ctrl/Cmd+Shift+M | workspaceManager |
| Delete Workspace | Ctrl/Cmd+Shift+D | workspaceManager |
| Export Workspace | Ctrl/Cmd+Shift+X | workspaceManager |
| Import Workspace | Ctrl/Cmd+Shift+I | workspaceManager |

---

## 6. **Testing Plan**

- Unit test core modules (`slotManager`, `workspaceManager`, `dataManager`).
- Test file/folder rename, delete, move (`eventHandler`).
- Test backup & recovery (`backup.ts`).
- Integration test: load plugin → manipulate slots → validate JSON.
