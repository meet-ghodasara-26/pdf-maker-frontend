import { useState, useCallback } from "react";
import {
  convertFileToPdf,
  convertMultipleFiles,
  downloadBlob,
  getPdfFilename,
} from "../api/converterApi";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".bmp",
  ".docx",
  ".doc",
  ".xlsx",
  ".xls",
  ".pptx",
  ".ppt",
  ".txt",
  ".html",
  ".htm",
  ".csv",
];

export const useConverter = () => {
  const [files, setFiles] = useState([]); // [{file, id, status, error, pdfBlob}]
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null); // {type, message}
  const [theme, setTheme] = useState("light");
  const [history, setHistory] = useState([]);

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  }, []);

  const validateFile = (file) => {
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported format: ${ext}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large (max 50MB): ${(file.size / 1024 / 1024).toFixed(1)}MB`;
    }
    return null;
  };

  const addFiles = useCallback(
    (newFiles) => {
      const entries = Array.from(newFiles).map((file) => {
        const error = validateFile(file);
        return {
          id: `${Date.now()}-${Math.random()}`,
          file,
          status: error ? "error" : "ready", // ready | converting | done | error
          error: error || null,
          pdfBlob: null,
          progress: 0,
        };
      });
      setFiles((prev) => [...prev, ...entries]);
      const invalid = entries.filter((e) => e.error);
      if (invalid.length) {
        showToast(
          "error",
          `${invalid.length} file(s) rejected: ${invalid[0].error}`,
        );
      }
    },
    [showToast],
  );

  const removeFile = useCallback((id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
    setProgress(0);
  }, []);

  const convertAll = useCallback(async () => {
    const readyFiles = files.filter((f) => f.status === "ready");
    if (!readyFiles.length) {
      showToast("error", "No valid files to convert.");
      return;
    }

    setConverting(true);
    setProgress(0);

    // Mark all as converting
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "ready" ? { ...f, status: "converting", progress: 0 } : f,
      ),
    );

    const results = [];

    for (const entry of readyFiles) {
      try {
        const blob = await convertFileToPdf(entry.file, (pct) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === entry.id ? { ...f, progress: pct } : f)),
          );
          setProgress(pct);
        });

        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "done", pdfBlob: blob, progress: 100 }
              : f,
          ),
        );
        results.push({
          success: true,
          name: getPdfFilename(entry.file.name),
          blob,
        });

        setHistory((prev) => [
          {
            id: entry.id,
            originalName: entry.file.name,
            pdfName: getPdfFilename(entry.file.name),
            size: entry.file.size,
            convertedAt: new Date().toLocaleTimeString(),
            blob,
          },
          ...prev.slice(0, 19),
        ]);
      } catch (err) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === entry.id
              ? { ...f, status: "error", error: err.message, progress: 0 }
              : f,
          ),
        );
        results.push({
          success: false,
          name: entry.file.name,
          error: err.message,
        });
      }
    }

    setConverting(false);
    setProgress(100);

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    if (successCount > 0 && failCount === 0) {
      showToast(
        "success",
        `✓ ${successCount} file${successCount > 1 ? "s" : ""} converted successfully!`,
      );
    } else if (successCount > 0) {
      showToast("warning", `${successCount} converted, ${failCount} failed.`);
    } else {
      showToast("error", `All conversions failed. ${results[0]?.error || ""}`);
    }
  }, [files, showToast]);

  const downloadFile = useCallback(
    (entry) => {
      if (!entry.pdfBlob) return;
      downloadBlob(entry.pdfBlob, getPdfFilename(entry.file.name));
      showToast("success", `Downloaded: ${getPdfFilename(entry.file.name)}`);
    },
    [showToast],
  );

  const downloadFromHistory = useCallback((item) => {
    if (!item.blob) return;
    downloadBlob(item.blob, item.pdfName);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme("light");
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    clearAll,
    converting,
    progress,
    convertAll,
    downloadFile,
    toast,
    showToast,
    theme,
    toggleTheme,
    history,
    downloadFromHistory,
  };
};
