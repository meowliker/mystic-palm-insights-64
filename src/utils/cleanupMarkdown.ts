// Utility function to clean up markdown symbols from text
export const cleanupMarkdown = (text: string): string => {
  if (!text) return text;
  
  return text
    .replace(/#{1,6}\s*/g, '') // Remove hashtags
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/\*(.*?)\*/g, '$1') // Remove italic markers
    .replace(/•/g, '-') // Replace bullet points with dashes
    .replace(/\n{3,}/g, '\n\n') // Replace multiple line breaks with double
    .trim();
};