import { useState, useEffect } from "react";
import { Clock, User, Mail, Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import emailHistoryService from "../../services/emailHistoryService";

export function EmailHistory({ documentType, serviceDate, recipientType, isOpen }) {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const EMAILS_PER_PAGE = 10;

  // Fetch email history when component becomes visible and documentType is provided
  useEffect(() => {
    if (isOpen && documentType && showHistory) {
      fetchEmailHistory(1); // Always start from page 1 when opening
    }
  }, [isOpen, documentType, serviceDate, recipientType, showHistory]);

  // Reset pagination when documentType, serviceDate, or recipientType changes
  useEffect(() => {
    setCurrentPage(1);
    setEmails([]);
    setTotalEmails(0);
    setHasMore(false);
  }, [documentType, serviceDate, recipientType]);

  const fetchEmailHistory = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the simple service with service date and recipient type filtering instead of pagination
      const response = await emailHistoryService.getEmailHistoryByDocumentSimple(
        documentType, 
        serviceDate, 
        recipientType
      );
      
      // The simple service returns { data: { emails: [...] } }
      const emailData = response?.data?.emails || [];
      
      // Since we're using the simple service without pagination, we need to implement client-side pagination
      const startIndex = (page - 1) * EMAILS_PER_PAGE;
      const endIndex = startIndex + EMAILS_PER_PAGE;
      const paginatedEmails = emailData.slice(startIndex, endIndex);
      
      setEmails(Array.isArray(paginatedEmails) ? paginatedEmails : []);
      setTotalEmails(emailData.length);
      setHasMore(endIndex < emailData.length);
      setCurrentPage(page);
      
    } catch (err) {
      console.error("Error fetching email history:", err);
      
      // For any error, just show empty state (most likely table doesn't exist yet)
      setEmails([]);
      setTotalEmails(0);
      setHasMore(false);
      setError(null); // Don't show error - empty state is fine for new features
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatEmails = (toEmail, ccEmails) => {
    let result = toEmail;
    if (ccEmails && ccEmails.trim()) {
      const ccList = ccEmails.split(',').map(email => email.trim()).filter(email => email);
      if (ccList.length > 0) {
        result += ` (CC: ${ccList.join(', ')})`;
      }
    }
    return result;
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory && documentType) {
      // Reset to page 1 when opening
      setCurrentPage(1);
      // fetchEmailHistory will be called by useEffect
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalEmails / EMAILS_PER_PAGE)) {
      fetchEmailHistory(newPage);
    }
  };

  const totalPages = Math.ceil(totalEmails / EMAILS_PER_PAGE);

  if (!documentType) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-4">
      {/* Toggle Button */}
      <button
        type="button"
        onClick={toggleHistory}
        className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
      >
        {showHistory ? (
          <>
            <EyeOff className="w-4 h-4" />
            Hide Email History
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            View Email History
          </>
        )}
      </button>

      {/* History Content */}
      {showHistory && (
        <div className="mt-3">
          <div className="bg-gray-50 rounded-lg border border-gray-200">
            <div className="p-3 border-b border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Email History for {documentType.charAt(0).toUpperCase() + documentType.slice(1)}
              </h4>
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  Loading email history...
                </div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-red-600">
                  {error}
                </div>
              ) : emails.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Mail className="w-8 h-8 text-gray-300" />
                    <div className="text-sm font-medium text-gray-600">
                      No Email History Yet
                    </div>
                    <div className="text-xs text-gray-500">
                      Emails sent for this {documentType} document will appear here
                    </div>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {emails.map((email) => (
                    <div key={email.id} className="p-3 hover:bg-gray-100 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                            <User className="w-3 h-3" />
                            <span className="font-medium">{email.sender_username}</span>
                            <span className="text-gray-400">({email.sender_role})</span>
                            <span className="text-gray-400">•</span>
                            <span>{formatDate(email.sent_at)}</span>
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900 truncate mb-1">
                            {email.subject}
                          </div>
                          
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">
                              {formatEmails(email.to_email, email.cc_emails)}
                            </span>
                          </div>
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          email.status === 'sent' 
                            ? 'bg-green-100 text-green-700' 
                            : email.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {email.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Pagination Controls */}
            {emails.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>
                    Showing {((currentPage - 1) * EMAILS_PER_PAGE) + 1} to {Math.min(currentPage * EMAILS_PER_PAGE, totalEmails)} of {totalEmails} emails
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-2 py-1 text-xs rounded ${
                            pageNum === currentPage
                              ? 'bg-indigo-600 text-white'
                              : 'text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}