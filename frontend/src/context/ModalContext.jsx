import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modalContent, setModalContent] = useState(null);
  const { t } = useLanguage();

  const showModal = useCallback((title, content) => {
    setModalContent({ title, content });
  }, []);

  const closeModal = useCallback(() => {
    setModalContent(null);
  }, []);

  const confirmModal = useCallback((title, onConfirm) => {
    setModalContent({
      title: t("common.confirm"),
      content: (
        <>
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>{title}</p>
          <div className="flex gap-2 justify-end">
            <button className="btn b2" onClick={closeModal}>{t("common.cancel")}</button>
            <button className="btn bd" onClick={() => { closeModal(); onConfirm(); }}>{t("common.confirm")}</button>
          </div>
        </>
      )
    });
  }, [closeModal, t]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeModal();
    };
    if (modalContent) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalContent, closeModal]);

  return (
    <ModalContext.Provider value={{ showModal, closeModal, confirmModal }}>
      {children}
      
      {modalContent && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true" aria-label={modalContent.title}>
          <div
            className="rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-5 shadow-2xl animate-[min_0.18s_ease_forwards]"
            style={{
              backgroundColor: "var(--color-surface, #ffffff)",
              color: "var(--color-text-primary, #0f172a)",
              border: "1px solid var(--color-border, #e2e8f0)"
            }}
          >
            <div className="flex justify-between mb-3 items-center">
              <h2 className="font-bold text-lg" style={{ color: "var(--color-text-primary, #0f172a)" }}>{modalContent.title}</h2>
              <button
                aria-label="Close dialog"
                onClick={closeModal}
                className="text-xl leading-none text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                style={{ background: "none", border: "none" }}
              >
                &times;
              </button>
            </div>
            {modalContent.content}
          </div>
        </div>
      )}

      <style>{`
        @keyframes min {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: none; }
        }
      `}</style>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("useModal must be used within ModalProvider");
  return context;
}
