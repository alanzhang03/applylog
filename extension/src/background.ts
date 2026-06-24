import { detectProvider, isJobPostingUrl } from '@autotrack/shared';

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;
  if (!isJobPostingUrl(tab.url)) return;

  console.log('[AutoTrack] job posting detected', {
    tabId,
    provider: detectProvider(tab.url),
    url: tab.url,
  });
});
