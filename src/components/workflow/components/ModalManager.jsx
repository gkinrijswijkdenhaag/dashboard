// src/components/workflow/components/ModalManager.jsx
import { DocumentCreatorModal } from "../../modals/document-creator-modal";
import { SendToPastorModal } from "../../modals/send-to-pastor-modal";
import { SendToMusicModal } from "../../modals/send-to-music-modal";
import { SermonUploadModal } from "../../modals/sermon-upload-modal";
import { PastorNotifyModal } from "../../modals/pastor-notify-modal";
import { TranslationModal } from "../../modals/translation-modal";
import { ViewTranslatedLyricsModal } from "../../modals/view-translated-lyrics-modal";
import { SermonTranslationModal } from "../../modals/sermon-translation-modal";
import { SlidesUploadModal } from "../../modals/slides-upload-modal";
import { QrCodeUploadModal } from "../../modals/qr-code-upload-modal";
import { MusicUploadModal } from "../../modals/music-upload-modal";
import { EditDocumentLinkModal } from "./EditDocumentLinkModal";
import { EditMusicLinksModal } from "./EditMusicLinksModal";
import { ViewMusicLinksModal } from "./ViewMusicLinksModal";

import { useWorkflow } from "../context/WorkflowContext";
import { useWorkflowHandlers } from "../hooks/useWorkflowHandlers";

export const ModalManager = () => {
  const {
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    isSermonModalOpen,
    setIsSermonModalOpen,
    currentDocumentType,
    isSendToPastorModalOpen,
    setIsSendToPastorModalOpen,
    currentDocumentToSend,
    isSendToMusicModalOpen,
    setIsSendToMusicModalOpen,
    currentDocumentToSendMusic,
    isSermonUploadModalOpen,
    setIsSermonUploadModalOpen,
    isPastorNotifyModalOpen,
    setIsPastorNotifyModalOpen,
    currentDocumentToNotify,
    isLyricsModalOpen,
    setIsLyricsModalOpen,
    isTranslationModalOpen,
    setIsTranslationModalOpen,
    currentLyrics,
    isViewTranslatedLyricsModalOpen,
    setIsViewTranslatedLyricsModalOpen,
    isSermonTranslationModalOpen,
    setIsSermonTranslationModalOpen,
    currentSermon,
    isSlidesUploadModalOpen,
    setIsSlidesUploadModalOpen,
    isQrCodeModalOpen,
    setIsQrCodeModalOpen,
    completedTasks,
    isMusicUploadModalOpen,
    setIsMusicUploadModalOpen,
    isEditDocumentLinkModalOpen,
    setIsEditDocumentLinkModalOpen,
    isEditMusicLinksModalOpen,
    setIsEditMusicLinksModalOpen,
    isViewMusicLinksModalOpen,
    setIsViewMusicLinksModalOpen,
    documentToEdit,
    setDocumentToEdit,
    musicLinksToEdit,
    setMusicLinksToEdit,
    musicLinksToView,
    setMusicLinksToView,
    isFetchingMusicLinks,
    dateString,
  } = useWorkflow();

  const {
    handleDocumentSubmit,
    handleSermonSubmit,
    handleSendToPastorSubmit,
    handleSendToMusicSubmit,
    handleSermonUploadSubmit,
    handlePastorNotifySubmit,
    handleLyricsSubmit,
    handleTranslationSubmit,
    handleSermonTranslationSubmit,
    handleSlidesUploadSubmit,
    handleQrCodeUploadSubmit,
    handleMusicUploadSubmit,
    handleSaveDocumentLink,
    handleDeleteDocumentLink,
    handleSaveMusicLinks,
    handleDeleteMusicLinks,
    loadingStates,
  } = useWorkflowHandlers();

  return (
    <>
      <DocumentCreatorModal
        isOpen={isDocumentModalOpen}
        onClose={() => setIsDocumentModalOpen(false)}
        onSubmit={handleDocumentSubmit}
        documentType={currentDocumentType}
        dateString={dateString}
      />

      <SendToPastorModal
        isOpen={isSendToPastorModalOpen}
        onClose={() => setIsSendToPastorModalOpen(false)}
        onSubmit={handleSendToPastorSubmit}
        documentType={currentDocumentToSend}
      />

      <SendToMusicModal
        isOpen={isSendToMusicModalOpen}
        onClose={() => setIsSendToMusicModalOpen(false)}
        onSubmit={handleSendToMusicSubmit}
        documentType={currentDocumentToSendMusic}
      />

      <SermonUploadModal
        isOpen={isSermonUploadModalOpen}
        onClose={() => setIsSermonUploadModalOpen(false)}
        onSubmit={handleSermonUploadSubmit}
      />

      <PastorNotifyModal
        isOpen={isPastorNotifyModalOpen}
        onClose={() => setIsPastorNotifyModalOpen(false)}
        onSubmit={handlePastorNotifySubmit}
        documentType={currentDocumentToNotify}
      />

      {/* Lyrics input is now handled directly in the translation page */}

      <TranslationModal
        isOpen={isTranslationModalOpen}
        onClose={() => setIsTranslationModalOpen(false)}
        onSubmit={handleTranslationSubmit}
        lyricsData={currentLyrics}
      />

      <ViewTranslatedLyricsModal
        isOpen={isViewTranslatedLyricsModalOpen}
        onClose={() => setIsViewTranslatedLyricsModalOpen(false)}
        lyricsData={currentLyrics}
      />

      <SermonTranslationModal
        isOpen={isSermonTranslationModalOpen}
        onClose={() => setIsSermonTranslationModalOpen(false)}
        onSubmit={handleSermonTranslationSubmit}
        sermonData={currentSermon}
        isSubmitting={loadingStates.sermonTranslation}
      />

      <SlidesUploadModal
        isOpen={isSlidesUploadModalOpen}
        onClose={() => setIsSlidesUploadModalOpen(false)}
        onSubmit={handleSlidesUploadSubmit}
        dateString={dateString}
      />

      <QrCodeUploadModal
        isOpen={isQrCodeModalOpen}
        onClose={() => setIsQrCodeModalOpen(false)}
        onSubmit={handleQrCodeUploadSubmit}
        dateString={dateString}
      />

      <MusicUploadModal
        isOpen={isMusicUploadModalOpen}
        onClose={() => setIsMusicUploadModalOpen(false)}
        onSubmit={handleMusicUploadSubmit}
        dateString={dateString}
      />

      <EditDocumentLinkModal
        isOpen={isEditDocumentLinkModalOpen}
        onClose={() => {
          setIsEditDocumentLinkModalOpen(false);
          setDocumentToEdit(null);
        }}
        documentType={documentToEdit?.taskId}
        initialLink={documentToEdit?.documentLink}
        onSave={handleSaveDocumentLink}
        onDelete={handleDeleteDocumentLink}
        metadata={documentToEdit?.metadata}
      />

      <EditMusicLinksModal
        isOpen={isEditMusicLinksModalOpen}
        onClose={() => {
          setIsEditMusicLinksModalOpen(false);
          setMusicLinksToEdit(null);
        }}
        initialLinks={musicLinksToEdit?.musicLinks}
        title={musicLinksToEdit?.title}
        notes={musicLinksToEdit?.notes}
        onSave={handleSaveMusicLinks}
        onDelete={handleDeleteMusicLinks}
        metadata={musicLinksToEdit?.metadata}
        dateString={dateString}
      />

      <ViewMusicLinksModal
        isOpen={isViewMusicLinksModalOpen}
        onClose={() => {
          setIsViewMusicLinksModalOpen(false);
          setMusicLinksToView(null);
        }}
        musicLinks={musicLinksToView?.musicLinks}
        title={musicLinksToView?.title}
        isLoading={isFetchingMusicLinks}
      />
    </>
  );
};
