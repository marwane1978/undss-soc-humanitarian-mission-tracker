import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Copy, Check, Languages, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { generateEmailHTML, generateEmailSubject } from "./emailTemplates";

export default function EmailPreview({ mission, segments, zones }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("email_language") || "en";
  });
  const [copied, setCopied] = useState(false);
  const [subjectCopied, setSubjectCopied] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("email_language", language);
  }, [language]);

  const sortedSegments = [...segments].sort((a, b) => a.segment_number - b.segment_number);
  const currentSegment = sortedSegments[sortedSegments.length - 1]; // Most recent segment

  const emailHTML = generateEmailHTML(mission, segments, zones, currentSegment, language);
  const emailSubject = generateEmailSubject(mission, currentSegment, zones);

  const handleCopySubject = async () => {
    try {
      await navigator.clipboard.writeText(emailSubject);
      setSubjectCopied(true);
      toast.success(language === 'fr' ? "Objet copié" : "Subject copied");
      setTimeout(() => setSubjectCopied(false), 2000);
    } catch (error) {
      toast.error(language === 'fr' ? "Erreur lors de la copie" : "Failed to copy");
    }
  };

  const handleCopyEmail = async () => {
    try {
      // Create a blob with HTML content
      const blob = new Blob([emailHTML], { type: 'text/html' });
      const clipboardItem = new ClipboardItem({ 'text/html': blob });
      
      await navigator.clipboard.write([clipboardItem]);
      
      setCopied(true);
      toast.success(language === 'fr' ? "Email copié avec le formatage" : "Email copied with formatting");
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      // Fallback: copy as plain HTML
      try {
        await navigator.clipboard.writeText(emailHTML);
        setCopied(true);
        toast.success(language === 'fr' ? "Email copié (HTML brut)" : "Email copied (raw HTML)");
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        toast.error(language === 'fr' ? "Erreur lors de la copie" : "Failed to copy");
      }
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="border-b bg-slate-50/50">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            {language === 'fr' ? "Aperçu Email SOC" : "SOC Email Preview"}
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-slate-500" />
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-24 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={handleCopyEmail}
              className={copied ? "bg-green-50 border-green-500" : ""}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2 text-green-600" />
                  {language === 'fr' ? "Copié !" : "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {language === 'fr' ? "Copier l'email" : "Copy Email"}
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-xs text-blue-600 font-semibold mb-1">
                {language === 'fr' ? "Objet de l'email :" : "Email Subject:"}
              </p>
              <p className="font-medium text-sm text-slate-900">{emailSubject}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopySubject}
              className={`shrink-0 ${subjectCopied ? 'bg-green-50 border-green-200' : ''}`}
            >
              {subjectCopied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-green-600" />
                  {language === 'fr' ? "Copié !" : "Copied!"}
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1.5" />
                  {language === 'fr' ? "Copier l'objet" : "Copy Subject"}
                </>
              )}
            </Button>
          </div>
        </div>
        <div 
          ref={emailRef}
          className="border rounded-lg overflow-auto max-h-[800px] bg-white"
          dangerouslySetInnerHTML={{ __html: emailHTML }}
        />
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700">
            {language === 'fr' 
              ? "💡 Cliquez sur 'Copier l'email' puis collez directement dans Outlook. Le formatage sera préservé."
              : "💡 Click 'Copy Email' then paste directly into Outlook. Formatting will be preserved."
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}