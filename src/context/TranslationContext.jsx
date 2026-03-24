import {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import lyricsService from "../services/lyricsService";
import authService from "../services/authService";
import { toast } from "react-hot-toast";

// Create context
const TranslationContext = createContext();

export const TranslationProvider = ({ children }) => {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [lyrics, setLyrics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentServiceDate, setCurrentServiceDate] = useState(null);

  // Fetch all lyrics that need translation
  const fetchAllLyrics = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await lyricsService.getAllLyrics();
      // Handle different possible response structures
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // If the response is already an array
          setLyrics(response.data);
        } else if (response.data.lyrics) {
          // If the response has a lyrics property
          setLyrics(response.data.lyrics);
        } else {
          // Default to empty array if structure is unexpected
          setLyrics([]);
        }
      } else {
        // Default to empty array if no data
        setLyrics([]);
      }
      setCurrentServiceDate(null);
    } catch (err) {
      console.error("Error fetching lyrics:", err);
      // Don't show error for 404 (no lyrics found) - this is an expected state
      if (err.response && err.response.status === 404) {
        setLyrics([]);
      } else {
        setError("Failed to load lyrics. Please try again later.");
        toast.error("Failed to load lyrics");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch lyrics for a specific service date
  const fetchLyricsByDate = useCallback(
    async (dateString) => {
      if (!user || !dateString) return;

      console.log(`Fetching lyrics for date: ${dateString}`);
      setLoading(true);
      setError(null);

      try {
        const response = await lyricsService.getLyricsByDate(dateString);
        console.log(`API response for ${dateString}:`, response);

        // Handle different possible response structures
        if (response && response.lyrics) {
          console.log("Setting lyrics from response.lyrics:", response.lyrics);
          setLyrics(response.lyrics);
        } else if (response && Array.isArray(response)) {
          console.log("Setting lyrics from array response:", response);
          setLyrics(response);
        } else {
          console.log(
            "No recognizable lyrics format in response, setting empty array"
          );
          setLyrics([]);
        }

        setCurrentServiceDate(dateString);
      } catch (err) {
        console.error(`Error fetching lyrics for date ${dateString}:`, err);
        // Handle 404 or "Service not found" errors as expected states
        if (
          (err.response && err.response.status === 404) ||
          (err.message &&
            (err.message.includes("Service not found") ||
              err.message.includes("Not Found")))
        ) {
          // This is an expected state - no lyrics exist for this date yet
          setLyrics([]);
          setCurrentServiceDate(dateString);
          // Don't show an error toast for this case
        } else {
          setError("Failed to load lyrics. Please try again later.");
          toast.error("Failed to load lyrics for this date");
        }
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Submit new lyrics for translation
  const submitLyrics = useCallback(
    async (dateString, songs) => {
      if (!user || !dateString || !songs) return;

      setLoading(true);
      setError(null);

      try {
        const response = await lyricsService.submitLyrics(dateString, songs);
        toast.success("Lyrics submitted successfully");

        // Always refresh lyrics for the selected date to ensure UI is updated
        await fetchLyricsByDate(dateString);
        setCurrentServiceDate(dateString);

        return response;
      } catch (err) {
        console.error("Error submitting lyrics:", err);
        setError("Failed to submit lyrics. Please try again later.");
        toast.error("Failed to submit lyrics");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user, currentServiceDate, fetchLyricsByDate]
  );

  // Submit translation for lyrics
  const submitTranslation = useCallback(
    async (originalId, translatedTitle, translatedLyrics) => {
      if (!user || !originalId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await lyricsService.submitTranslation(
          originalId,
          translatedTitle,
          translatedLyrics
        );

        // toast.success("Translation submitted successfully"); // Disabled in favor of banner feedback

        // Update the lyrics state with the new translation
        console.log("Translation response:", response);

        // Handle the response structure correctly
        const translationData = response.translation || {};

        setLyrics((prevLyrics) =>
          prevLyrics.map((lyric) =>
            lyric.id === originalId
              ? {
                  ...lyric,
                  status: "translated",
                  translation: {
                    ...translationData,
                    translated_by: {
                      name: user.username,
                      avatar: user.avatar_url,
                    },
                  },
                }
              : lyric
          )
        );

        return response;
      } catch (err) {
        console.error("Error submitting translation:", err);
        setError("Failed to submit translation. Please try again later.");
        toast.error("Failed to submit translation");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Approve a translation
  const approveTranslation = useCallback(
    async (translationId, originalId) => {
      if (!user || !translationId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await lyricsService.approveTranslation(translationId);

        toast.success("Translation approved successfully");

        // Update the lyrics state with the approved status
        setLyrics((prevLyrics) =>
          prevLyrics.map((lyric) =>
            lyric.id === originalId && lyric.translation?.id === translationId
              ? {
                  ...lyric,
                  translation: {
                    ...lyric.translation,
                    status: "approved",
                  },
                }
              : lyric
          )
        );

        return response;
      } catch (err) {
        console.error("Error approving translation:", err);
        setError("Failed to approve translation. Please try again later.");
        toast.error("Failed to approve translation");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  // Load lyrics on initial mount
  useEffect(() => {
    if (user) {
      fetchAllLyrics();
    }
  }, [user, fetchAllLyrics]);

  // Context value
  const value = {
    lyrics,
    loading,
    error,
    currentServiceDate,
    fetchAllLyrics,
    fetchLyricsByDate,
    submitLyrics,
    submitTranslation,
    approveTranslation,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
};

// Custom hook to use the translation context
export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within a TranslationProvider");
  }
  return context;
};

export default TranslationContext;
