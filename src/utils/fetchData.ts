import { ERROR_MESSAGES } from "../constants";
import { Config } from "../types";

/**
 * Fixes an incomplete XML feed by ensuring it ends with a complete <item> tag
 * and closes with </channel></rss> tags. If no incomplete <item> tags are found,
 * the original XML data is returned unmodified.
 * @param xmlData The XML data that may be incomplete.
 * @returns The fixed XML data with properly closed tags.
 */
function fixIncompleteFeed(xmlData: string): string {
  // Length of the </item> tag
  const itemTagLength = 7;

  // Find the last complete <item> tag
  const lastItemIndex = xmlData.lastIndexOf("</item>");

  // If no <item> tag is found, return the original data
  if (lastItemIndex === -1) {
    return xmlData;
  }

  // Cut off everything after the last complete <item> tag
  const fixedData = xmlData.substring(0, lastItemIndex + itemTagLength);

  // Close the feed with </channel></rss>
  return `${fixedData}</channel></rss>`;
}

/**
 * Fetches the content from the provided URL.
 * @param url The URL of the content.
 * @param config Optional configuration object for fetch request.
 * @returns A promise that resolves to the text content of the response.
 */
export async function fetchData(url: URL, config?: Config): Promise<string> {
  const headers = new Headers(config?.requestHeaders);

  if (config?.requestSize) {
    headers.set("Range", `bytes=0-${config.requestSize}`);
  }

  const response = await fetch(url.toString(), { headers });
  if (!response.ok) {
    throw new Error(ERROR_MESSAGES.FETCH_FAILED);
  }
  let text = await response.text();

  if (config?.requestSize) {
    text = fixIncompleteFeed(text);
  }

  return text;
}
