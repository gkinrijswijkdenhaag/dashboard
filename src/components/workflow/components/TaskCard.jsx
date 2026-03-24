// src/components/workflow/components/TaskCard.jsx
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import {
  CheckCircle,
  AlertCircle,
  Mail,
  Music,
  Edit,
  ArrowRight,
  Upload,
  Link,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useWorkflow } from "../context/WorkflowContext";
import { useWorkflowHandlers } from "../hooks/useWorkflowHandlers";
import { MusicUploadModal } from "../../modals/music-upload-modal";

// Task type specific styling
const taskTypeStyles = {
  // Liturgy tasks - blue theme
  concept: {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    viewButton: "border-blue-300 text-blue-700 hover:bg-blue-50",
    icon: "text-blue-500",
  },
  sermon: {
    primary: "bg-purple-600 hover:bg-purple-700",
    secondary: "bg-purple-500 hover:bg-purple-600",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    viewButton: "border-purple-300 text-purple-700 hover:bg-purple-50",
    icon: "text-purple-500",
  },
  final: {
    primary: "bg-blue-600 hover:bg-blue-700",
    secondary: "bg-blue-500 hover:bg-blue-600",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    viewButton: "border-blue-300 text-blue-700 hover:bg-blue-50",
    icon: "text-blue-500",
  },

  // QR code - emerald theme
  qrcode: {
    primary: "bg-emerald-600 hover:bg-emerald-700",
    secondary: "bg-emerald-500 hover:bg-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    viewButton: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    icon: "text-emerald-500",
  },

  // Translation tasks - green theme
  translate_lyrics: {
    primary: "bg-green-600 hover:bg-green-700",
    secondary: "bg-green-500 hover:bg-green-600",
    badge: "bg-green-100 text-green-700 border-green-200",
    viewButton: "border-green-300 text-green-700 hover:bg-green-50",
    icon: "text-green-500",
  },
  "translate-sermon": {
    primary: "bg-green-600 hover:bg-green-700",
    secondary: "bg-green-500 hover:bg-green-600",
    badge: "bg-green-100 text-green-700 border-green-200",
    viewButton: "border-green-300 text-green-700 hover:bg-green-50",
    icon: "text-green-500",
  },

  // Beamer tasks - orange theme
  slides: {
    primary: "bg-orange-600 hover:bg-orange-700",
    secondary: "bg-orange-500 hover:bg-orange-600",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    viewButton: "border-orange-300 text-orange-700 hover:bg-orange-50",
    icon: "text-orange-500",
  },

  // Music tasks - indigo theme
  music: {
    primary: "bg-indigo-600 hover:bg-indigo-700",
    secondary: "bg-indigo-500 hover:bg-indigo-600",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    viewButton: "border-indigo-300 text-indigo-700 hover:bg-indigo-50",
    icon: "text-indigo-500",
  },
};

// Default style for tasks without specific styling
const defaultTaskStyle = {
  primary: "bg-gray-600 hover:bg-gray-700",
  secondary: "bg-gray-500 hover:bg-gray-600",
  badge: "bg-gray-100 text-gray-700 border-gray-200",
  viewButton: "border-gray-300 text-gray-700 hover:bg-gray-50",
  icon: "text-gray-500",
};

export const TaskCard = ({ task, categoryId }) => {
  const {
    getTaskStatus,
    hasRole,
    completedTasks,
    setCompletedTasks,
    updateTaskStatus,
    dateString,
    getSendStatus,
  } = useWorkflow();

  // Helper function to check if a document link exists for a task
  const hasDocumentLink = (taskId) => {
    return !!(
      (completedTasks[taskId] && completedTasks[taskId].documentLink) ||
      (completedTasks?.documentLinks && completedTasks.documentLinks[taskId])
    );
  };

  // Helper function to get send button text and status
  const getSendButtonInfo = (taskId, recipientType) => {
    const sendStatus = getSendStatus(taskId, recipientType);

    if (sendStatus.hasSent) {
      return {
        text: recipientType === "pastor" ? "Send to Pastor" : "Send to Music",
        isSent: true,
        subtitle: `Last sent by ${sendStatus.lastSentBy}`,
        className: "",
      };
    }

    return {
      text: recipientType === "pastor" ? "Send to Pastor" : "Send to Music",
      isSent: false,
      subtitle: null,
      className: "",
    };
  };

  const {
    handleActionStart,
    handleViewDocument,
    handleViewMusicLinks,
    handleSendToPastor,
    handleSendToMusic,
    handlePastorEdit,
    handlePastorNotifyTeams,
    handleQrCodeAction,
    handleAddLyrics,
    handleTranslateLyrics,
    handleViewTranslatedLyrics,
    handleTranslateSermon,
    handleUploadSermon,
    handleUploadSlides,
    handleUploadMusic,
    handleEditDocumentLink,
    loadingStates,
  } = useWorkflowHandlers();

  const status = getTaskStatus(task.id);
  const isCompleted = status === "completed";
  const isActive = status === "active";
  const isQrCodeTask = task.id === "qrcode";

  // Get task-specific styling or use default
  const taskStyle = taskTypeStyles[task.id] || defaultTaskStyle;

  // Button styles with task-specific colors
  const primaryButtonClass = `w-full text-white text-xs py-2 h-9 rounded-md font-medium shadow-sm hover:shadow transition-all ${taskStyle.primary}`;
  const secondaryButtonClass = `w-full text-white text-xs py-2 h-9 rounded-md font-medium shadow-sm hover:shadow transition-all ${taskStyle.secondary}`;
  const viewButtonClass = `w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all ${taskStyle.viewButton}`;

  return (
    <div
      className={`p-3 border rounded-lg flex flex-col items-center text-center ${
        isCompleted
          ? "bg-green-50 border-green-200"
          : isActive
          ? `bg-${
              task.id === "qrcode" ? "emerald" : taskStyle.icon.split("-")[1]
            }-50 border-${
              task.id === "qrcode" ? "emerald" : taskStyle.icon.split("-")[1]
            }-300 border-2 shadow`
          : "bg-gray-50 border-gray-200"
      }`}
    >
      {/* Task icon with task-specific color - now clickable with enhanced visual indicators */}
      <div
        className={`mb-1 ${
          [
            "concept",
            "sermon",
            "final",
            "slides",
            "translate_lyrics",
            "translate-sermon",
          ].includes(task.id)
            ? "cursor-pointer hover:scale-110 transition-transform relative group"
            : ""
        }`}
        onClick={() => {
          // Handle different task types when icon is clicked
          if (["concept", "sermon", "final", "slides"].includes(task.id)) {
            handleViewDocument(task.id);
          } else if (task.id === "translate_lyrics") {
            // Redirect to translation page with translated tab active
            if (task.route) {
              window.location.href = `${task.route}?tab=translated&date=${dateString}`;
            }
          } else if (task.id === "translate-sermon") {
            // Open the sermon translation modal instead of redirecting directly
            handleTranslateSermon();
          }
        }}
        title={
          ["concept", "sermon", "final", "slides"].includes(task.id)
            ? "Click to open in Google Drive"
            : task.id === "translate_lyrics"
            ? "Click to go to lyrics translation page"
            : task.id === "translate-sermon"
            ? "Click to open sermon document for translation"
            : ""
        }
      >
        {/* Visual clickability indicator for all devices */}
        {(["concept", "sermon", "final", "slides"].includes(task.id) ||
          task.id === "translate_lyrics" ||
          task.id === "translate-sermon") && (
          <>
            {/* Blue dot indicator that's always visible on mobile, shows on hover for desktop */}
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 ${
                task.id === "translate_lyrics" || task.id === "translate-sermon"
                  ? "bg-green-500"
                  : "bg-blue-500"
              } rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity`}
            ></div>
            {/* Touch/click icon indicator for mobile */}
            <div
              className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-[10px] ${
                task.id === "translate_lyrics" || task.id === "translate-sermon"
                  ? "text-green-600"
                  : "text-blue-600"
              } font-medium md:hidden`}
            >
              tap
            </div>
          </>
        )}
        <div
          className={
            ["concept", "sermon", "final", "slides"].includes(task.id)
              ? "p-1 rounded-full border-2 border-dashed border-opacity-50 border-blue-300"
              : task.id === "translate_lyrics" || task.id === "translate-sermon"
              ? "p-1 rounded-full border-2 border-dashed border-opacity-50 border-green-300"
              : ""
          }
        >
          {isCompleted ? (
            <CheckCircle className={`w-6 h-6 text-green-500`} />
          ) : isActive ? (
            <AlertCircle
              className={`w-6 h-6 ${taskStyle.icon} animate-pulse`}
            />
          ) : (
            <task.icon className={`w-6 h-6 ${taskStyle.icon}`} />
          )}
        </div>
      </div>

      {/* Task name */}
      <div className="font-medium text-sm mb-2">{task.name}</div>

      {/* Document metadata (if available) */}
      {completedTasks[task.id]?.documentLink &&
        ["concept", "sermon", "final", "qrcode", "slides", "music"].includes(
          task.id
        ) && (
          <div className="w-full text-xs text-gray-500 mb-2 px-1">
            {completedTasks[task.id]?.updatedAt && (
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-3 h-3" />
                <span>
                  {new Date(
                    completedTasks[task.id].updatedAt
                  ).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            )}
            {completedTasks[task.id]?.updatedBy && (
              <div className="flex items-center justify-center gap-1">
                <User className="w-3 h-3" />
                <span className="capitalize">
                  {completedTasks[task.id].updatedBy}
                </span>
              </div>
            )}
          </div>
        )}

      {/* Status badge */}
      {!isActive && !isCompleted && (
        <Badge className={`mb-3 px-3 py-1 text-xs ${taskStyle.badge}`}>
          Pending
        </Badge>
      )}

      {isActive &&
        !isCompleted &&
        !isQrCodeTask &&
        !hasRole(task.restrictedTo) && (
          <Badge
            className={`mb-3 px-3 py-1 text-xs ${taskStyle.badge.replace(
              "border",
              "border-2"
            )} animate-pulse flex items-center gap-1`}
          >
            <span className="w-2 h-2 rounded-full bg-current"></span>
            In Progress
          </Badge>
        )}

      {isCompleted && (
        <Badge
          className={`mb-3 px-3 py-1 text-xs bg-green-100 text-green-700 border border-green-200 flex items-center gap-1`}
        >
          <CheckCircle className="w-3 h-3" />
          Completed
        </Badge>
      )}

      {/* Action buttons container */}
      <div className="w-full mt-auto flex flex-col justify-end space-y-2">
        {/* Liturgy Maker tasks */}
        {(task.id === "concept" ||
          task.id === "sermon" ||
          task.id === "final") && (
          <>
            {/* Show sermon creation/upload options */}
            {task.id === "sermon" && !isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={() => handleUploadSermon(task.id)}
                disabled={
                  loadingStates?.sermonEdit || loadingStates?.sermonDocument
                }
              >
                {loadingStates?.sermonEdit || loadingStates?.sermonDocument ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    {loadingStates?.sermonDocument ? "Saving..." : "Loading..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-3 h-3 mr-1" />
                    Upload Sermon
                  </>
                )}
              </Button>
            )}

            {/* Show document creation buttons */}
            {(task.id === "concept" || task.id === "final") && !isCompleted && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  className={primaryButtonClass}
                  onClick={() => handleActionStart(task.id)}
                  disabled={loadingStates?.conceptDocument}
                >
                  {task.id === "concept" && loadingStates?.conceptDocument ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-3 h-3 mr-1" />
                      {task.actionLabel}
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  className={`${secondaryButtonClass} ${
                    !hasDocumentLink(task.id)
                      ? "opacity-50 cursor-not-allowed"
                      : getSendButtonInfo(task.id, "pastor").className
                  } ${
                    getSendButtonInfo(task.id, "pastor").isSent
                      ? "relative"
                      : ""
                  }`}
                  onClick={() => {
                    if (hasDocumentLink(task.id)) {
                      handleSendToPastor(task.id);
                    }
                  }}
                  disabled={!hasDocumentLink(task.id)}
                  title={
                    !hasDocumentLink(task.id)
                      ? "No document link available"
                      : getSendButtonInfo(task.id, "pastor").subtitle ||
                        getSendButtonInfo(task.id, "pastor").text
                  }
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-xs font-medium">
                      {getSendButtonInfo(task.id, "pastor").text}
                    </span>
                    {getSendButtonInfo(task.id, "pastor").subtitle && (
                      <span className="text-[10px] opacity-75">
                        {getSendButtonInfo(task.id, "pastor").subtitle}
                      </span>
                    )}
                  </div>
                  {getSendButtonInfo(task.id, "pastor").isSent && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </Button>

                <Button
                  size="sm"
                  className={`${secondaryButtonClass} ${
                    !hasDocumentLink(task.id)
                      ? "opacity-50 cursor-not-allowed"
                      : getSendButtonInfo(task.id, "music").className
                  } ${
                    getSendButtonInfo(task.id, "music").isSent ? "relative" : ""
                  }`}
                  onClick={() => {
                    if (hasDocumentLink(task.id)) {
                      handleSendToMusic(task.id);
                    }
                  }}
                  disabled={!hasDocumentLink(task.id)}
                  title={
                    !hasDocumentLink(task.id)
                      ? "No document link available"
                      : getSendButtonInfo(task.id, "music").subtitle ||
                        getSendButtonInfo(task.id, "music").text
                  }
                >
                  <Music className="w-3 h-3 mr-1" />
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-xs font-medium">
                      {getSendButtonInfo(task.id, "music").text}
                    </span>
                    {getSendButtonInfo(task.id, "music").subtitle && (
                      <span className="text-[10px] opacity-75">
                        {getSendButtonInfo(task.id, "music").subtitle}
                      </span>
                    )}
                  </div>
                  {getSendButtonInfo(task.id, "music").isSent && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </Button>
              </div>
            )}

            {/* Document viewing section */}
            {isCompleted && (
              <div className="space-y-2">
                {!(task.id === "sermon" && hasRole("pastor")) && (
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      className={viewButtonClass}
                      onClick={() => handleViewDocument(task.id)}
                    >
                      {task.id === "sermon" ? "View Sermon" : "View Document"}
                    </Button>

                    {/* Add Send to Pastor and Send to Music buttons for completed concept and final documents */}
                    {(task.id === "concept" || task.id === "final") && (
                      <>
                        <Button
                          size="sm"
                          className={`${secondaryButtonClass} ${
                            !hasDocumentLink(task.id)
                              ? "opacity-50 cursor-not-allowed"
                              : getSendButtonInfo(task.id, "pastor").className
                          } ${
                            getSendButtonInfo(task.id, "pastor").isSent
                              ? "relative"
                              : ""
                          }`}
                          onClick={() => {
                            if (hasDocumentLink(task.id)) {
                              handleSendToPastor(task.id);
                            }
                          }}
                          disabled={!hasDocumentLink(task.id)}
                          title={
                            !hasDocumentLink(task.id)
                              ? "No document link available"
                              : getSendButtonInfo(task.id, "pastor").subtitle ||
                                getSendButtonInfo(task.id, "pastor").text
                          }
                        >
                          <ArrowRight className="w-3 h-3 mr-1" />
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs font-medium">
                              {getSendButtonInfo(task.id, "pastor").text}
                            </span>
                            {getSendButtonInfo(task.id, "pastor").subtitle && (
                              <span className="text-[10px] opacity-75">
                                {getSendButtonInfo(task.id, "pastor").subtitle}
                              </span>
                            )}
                          </div>
                          {getSendButtonInfo(task.id, "pastor").isSent && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          className={`${secondaryButtonClass} ${
                            !hasDocumentLink(task.id)
                              ? "opacity-50 cursor-not-allowed"
                              : getSendButtonInfo(task.id, "music").className
                          } ${
                            getSendButtonInfo(task.id, "music").isSent
                              ? "relative"
                              : ""
                          }`}
                          onClick={() => {
                            if (hasDocumentLink(task.id)) {
                              handleSendToMusic(task.id);
                            }
                          }}
                          disabled={!hasDocumentLink(task.id)}
                          title={
                            !hasDocumentLink(task.id)
                              ? "No document link available"
                              : getSendButtonInfo(task.id, "music").subtitle ||
                                getSendButtonInfo(task.id, "music").text
                          }
                        >
                          <Music className="w-3 h-3 mr-1" />
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-xs font-medium">
                              {getSendButtonInfo(task.id, "music").text}
                            </span>
                            {getSendButtonInfo(task.id, "music").subtitle && (
                              <span className="text-[10px] opacity-75">
                                {getSendButtonInfo(task.id, "music").subtitle}
                              </span>
                            )}
                          </div>
                          {getSendButtonInfo(task.id, "music").isSent && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      className={`w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all border-gray-300 text-gray-700 hover:bg-gray-50`}
                      onClick={() => handleEditDocumentLink(task.id)}
                      disabled={loadingStates?.documentEdit}
                    >
                      {loadingStates?.documentEdit &&
                      (task.id === "concept" || task.id === "sermon") ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Link className="w-3 h-3 mr-1" />
                          Edit Link
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Pastor special options */}
                {hasRole("pastor") &&
                  (task.id === "concept" || task.id === "final") && (
                    <div className="space-y-2 mt-2">
                      <Button
                        size="sm"
                        className={`w-full text-white text-xs py-1 h-8 rounded-md flex items-center justify-center gap-1 ${taskStyle.primary}`}
                        onClick={() => handlePastorEdit(task.id)}
                      >
                        <Edit className="w-3 h-3" />
                        Edit Document
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white text-xs py-1 h-8 rounded-md flex items-center justify-center gap-1"
                        onClick={() => handlePastorNotifyTeams(task.id)}
                      >
                        <Mail className="w-3 h-3" />
                        Notify Teams
                      </Button>
                    </div>
                  )}
              </div>
            )}
          </>
        )}

        {/* QR Code handling */}
        {isQrCodeTask && !isCompleted && (
          <Button
            size="sm"
            className={primaryButtonClass}
            onClick={() => handleQrCodeAction(isActive ? "complete" : "upload")}
            disabled={
              loadingStates?.qrcodeEdit || loadingStates?.qrcodeDocument
            }
          >
            {loadingStates?.qrcodeEdit || loadingStates?.qrcodeDocument ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {loadingStates?.qrcodeDocument ? "Saving..." : "Loading..."}
              </>
            ) : isActive ? (
              "Finish Upload"
            ) : (
              task.actionLabel
            )}
          </Button>
        )}

        {/* QR Code viewing when completed */}
        {isQrCodeTask && isCompleted && (
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className={viewButtonClass}
              onClick={() => handleViewDocument("qrcode")}
            >
              View QR Code
            </Button>

            <Button
              size="sm"
              className={`w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all border-gray-300 text-gray-700 hover:bg-gray-50`}
              onClick={() => handleEditDocumentLink("qrcode")}
              disabled={loadingStates?.documentEdit}
            >
              {loadingStates?.documentEdit && task.id === "qrcode" ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Link className="w-3 h-3 mr-1" />
                  Edit Link
                </>
              )}
            </Button>
          </div>
        )}

        {/* Lyrics translation task */}
        {task.id === "translate_lyrics" && (
          <>
            <Button
              size="sm"
              className={primaryButtonClass}
              onClick={() => {
                if (task.route) {
                  window.location.href = `${task.route}?tab=translated&date=${dateString}`;
                }
              }}
            >
              Go to Translation Page
            </Button>

            {completedTasks?.["translate_lyrics"] === "completed" && (
              <Button
                size="sm"
                className={viewButtonClass}
                onClick={handleViewTranslatedLyrics}
              >
                View Translations
              </Button>
            )}
          </>
        )}

        {/* Sermon translation task */}
        {task.id === "translate-sermon" && (
          <>
            <Button
              size="sm"
              className={primaryButtonClass}
              onClick={handleTranslateSermon}
            >
              Translate Sermon
            </Button>

            {(completedTasks?.["translate-sermon"]?.status === "completed" ||
              completedTasks?.["translate_sermon"]?.status === "completed" ||
              getTaskStatus("translate-sermon") === "completed" ||
              getTaskStatus("translate_sermon") === "completed") && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  className={viewButtonClass}
                  onClick={() => {
                    let documentUrl;

                    if (
                      completedTasks["sermon"] &&
                      completedTasks["sermon"].documentLink
                    ) {
                      documentUrl = completedTasks["sermon"].documentLink;
                    } else if (
                      completedTasks?.documentLinks &&
                      completedTasks.documentLinks["sermon"]
                    ) {
                      documentUrl = completedTasks.documentLinks["sermon"];
                    }

                    if (documentUrl) {
                      window.open(documentUrl, "_blank");
                    } else {
                      toast.error("Sermon document link is not available.");
                    }
                  }}
                >
                  View Translation
                </Button>

                {/* Show translator info if available */}
                {completedTasks?.sermonTranslationData?.translator && (
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-1 mt-1">
                    <User className="w-3 h-3" />
                    <span>
                      Translated by{" "}
                      {completedTasks.sermonTranslationData.translator.name}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Beamer slides task */}
        {task.id === "slides" && (
          <>
            {!isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={handleUploadSlides}
              >
                <Upload className="w-3 h-3 mr-1" />
                Upload Slides
              </Button>
            )}

            {isCompleted && (
              <div className="space-y-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={viewButtonClass}
                  onClick={() => handleViewDocument("slides")}
                >
                  View Slides
                </Button>

                <Button
                  size="sm"
                  className={`w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all border-gray-300 text-gray-700 hover:bg-gray-50`}
                  onClick={() => handleEditDocumentLink("slides")}
                >
                  <Link className="w-3 h-3 mr-1" />
                  Edit Link
                </Button>
              </div>
            )}
          </>
        )}

        {/* Music upload task */}
        {task.id === "music" && (
          <>
            {!isCompleted && (
              <Button
                size="sm"
                className={primaryButtonClass}
                onClick={handleUploadMusic}
              >
                <Music className="w-3 h-3 mr-1" />
                Upload Music
              </Button>
            )}

            {isCompleted && (
              <div className="space-y-2">
                <div className="space-y-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className={`${viewButtonClass} flex items-center justify-center`}
                    onClick={handleViewMusicLinks}
                    disabled={loadingStates.musicLinks}
                  >
                    {loadingStates.musicLinks ? (
                      <>
                        <span className="w-3 h-3 mr-1 rounded-full border-2 border-t-transparent border-blue-500 animate-spin"></span>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Music className="w-3 h-3 mr-1" />
                        View Music
                        {completedTasks?.music?.musicLinks &&
                          completedTasks.music.musicLinks.length > 0 && (
                            <span className="ml-1 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
                              {completedTasks.music.musicLinks.length}
                            </span>
                          )}
                      </>
                    )}
                  </Button>
                </div>

                <Button
                  size="sm"
                  className={`w-full border text-xs py-1.5 h-9 rounded-md font-medium hover:shadow transition-all border-gray-300 text-gray-700 hover:bg-gray-50`}
                  onClick={() => handleEditDocumentLink("music")}
                >
                  <Link className="w-3 h-3 mr-1" />
                  Edit Links
                </Button>

                {/* Show notes if available */}
                {completedTasks?.music?.notes && (
                  <div className="text-xs text-gray-600 mt-1 p-2 bg-gray-50 border border-gray-100 rounded">
                    <span className="font-medium">Notes:</span>{" "}
                    {completedTasks.music.notes}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};