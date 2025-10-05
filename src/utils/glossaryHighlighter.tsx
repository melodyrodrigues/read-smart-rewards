import { ReactNode } from "react";
import { GlossaryPopover } from "@/components/GlossaryPopover";

// Keywords to highlight in the text
const glossaryKeywords = [
  "ionosphere",
  "ionosfera",
  "aurora",
  "magnetosphere",
  "magnetosfera",
  "radiation",
  "radiacao",
  "radiação",
  "satellite",
  "satelite",
  "satélite",
  "solar",
  "cosmic",
  "cosmico",
  "cósmico",
  "atmosphere",
  "atmosfera",
];

/**
 * Highlights glossary terms in text and wraps them with interactive popovers
 */
export const highlightGlossaryTerms = (text: string): ReactNode[] => {
  const pattern = new RegExp(
    `\\b(${glossaryKeywords.join("|")})\\b`,
    "gi"
  );

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = pattern.exec(text)) !== null) {
    const matchIndex = match.index;
    const matchedTerm = match[0];

    // Add text before the match
    if (matchIndex > lastIndex) {
      parts.push(
        <span key={`text-${keyCounter++}`}>
          {text.substring(lastIndex, matchIndex)}
        </span>
      );
    }

    // Add the highlighted term with glossary popover
    parts.push(
      <GlossaryPopover key={`term-${keyCounter++}`} term={matchedTerm}>
        {matchedTerm}
      </GlossaryPopover>
    );

    lastIndex = matchIndex + matchedTerm.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${keyCounter++}`}>{text.substring(lastIndex)}</span>
    );
  }

  return parts.length > 0 ? parts : [text];
};
