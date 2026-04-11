export const UI_MESSAGES = {
  createFailed: "We could not create your link.",
  createFailedToastTitle: "Could not create link",
  createFailedToastDescription: "Check the form and try again.",
  createSuccessToastTitle: "Link created",
  createSuccessToastDescription: "Your personalized link is ready.",
  fetchLinksFailed: "We could not load your links.",
  deleteLinkFailed: "We could not remove this link.",
  deleteConfirm: (title: string) => {
    return `Remove ${title}? This cannot be undone.`;
  },
  copySuccessTitle: "Link copied",
  copySuccessDescription: "The link is on your clipboard.",
  copyFailedTitle: "Could not copy link",
  copyFailedDescription: "Please copy it manually.",
} as const;