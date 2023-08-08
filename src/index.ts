import { DOMParser, XMLSerializer } from "xmldom";

import { Podcast, Episode } from "./types";
export { Podcast, Episode };

/**
 * Preprocesses an XML string to handle entities and unclosed tags.
 *
 * @param xmlString - The XML string to preprocess.
 * @returns The preprocessed XML string.
 */
function preprocessXml(xmlString: string): string {
  // Check if the XML string has a root node
  if (!xmlString.startsWith("<")) {
    // Add a root node to the XML string
    xmlString = `<root>${xmlString}</root>`;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "text/xml");

  // Convert the document back to a string to handle undefined entities gracefully
  return new XMLSerializer().serializeToString(doc);
}

/**
 * Fetches XML content from a URL using Fetch API.
 *
 * @param {string} url - The URL from which to fetch the XML content.
 * @returns {Promise<string>} A Promise that resolves to the XML content as a string.
 * @throws {Error} If there is an error fetching the XML content from the URL.
 */
async function fetchXmlFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    throw error;
  }
}

/**
 * Retrieves the text content of a specified XML element.
 *
 * @param element - The XML element to retrieve content from.
 * @param tagName - The tag name whose content is to be retrieved.
 * @returns The text content of the specified element's tag or an empty string if not found.
 */
function getText(element: Element, tagName: string): string {
  const node = element?.getElementsByTagName(tagName)[0];
  return node ? node.textContent || "" : "";
}

/**
 * Helper function to create an `Episode` instance from an XML item element.
 *
 * @param item - The XML element representing an episode.
 * @returns The created `Episode` object.
 */
function createEpisodeFromItem(item: Element): Episode {
  const episode: Episode = {
    author: getText(item, "author"),
    contentEncoded: getText(item, "content:encoded"),
    description: getText(item, "description"),
    enclosure: {
      url: item.getElementsByTagName("enclosure")[0]?.getAttribute("url") || "",
      type: item.getElementsByTagName("enclosure")[0]?.getAttribute("type") || "",
    },
    guid: getText(item, "guid"),
    itunesAuthor: getText(item, "itunes:author"),
    itunesDuration: getText(item, "itunes:duration"),
    itunesEpisode: getText(item, "itunes:episode"),
    itunesEpisodeType: getText(item, "itunes:episodeType"),
    itunesExplicit: getText(item, "itunes:explicit"),
    itunesSubtitle: getText(item, "itunes:subtitle"),
    itunesSummary: getText(item, "itunes:summary"),
    itunesTitle: getText(item, "itunes:title"),
    link: getText(item, "link"),
    pubDate: getText(item, "pubDate"),
    title: getText(item, "title"),
  };

  return episode;
}

/**
 * Parses an XML podcast feed and returns a `Podcast` object.
 *
 * @param xmlSource - The XML string or URL representing the podcast feed.
 *                    If an XML string is provided, it will be directly parsed as the XML content.
 *                    If a URL is provided, the XML content will be fetched from the URL before parsing.
 * @returns The parsed `Podcast` object.
 */
export default async function podcastXmlParser(xmlSource: string | URL): Promise<{ podcast: Podcast; episodes: Episode[] }> {
  if (typeof xmlSource === "string" && xmlSource.trim() === "") {
    throw new Error("Empty XML feed. Please provide valid XML content.");
  }

  let xmlString: string;

  // Check if xmlSource is a URL (by checking its constructor)
  if (xmlSource instanceof URL) {
    // If it's a URL, fetch the XML content from the URL
    xmlString = await fetchXmlFromUrl(xmlSource.toString());
  } else {
    // If it's a string, use it directly as the XML content
    xmlString = xmlSource;
  }

  const preprocessedXml = preprocessXml(xmlString);
  const parser = new DOMParser();
  const doc = parser.parseFromString(preprocessedXml, "text/xml");
  const items = doc.getElementsByTagName("item");
  const episodes: Episode[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const episode = createEpisodeFromItem(item);
    episodes.push(episode);
  }

  const podcast: Podcast = {
    copyright: getText(doc.documentElement, "copyright"),
    contentEncoded: getText(doc.documentElement, "content:encoded"),
    description: getText(doc.documentElement, "description"),
    feedUrl: xmlSource instanceof URL ? xmlSource.toString() : doc.getElementsByTagName("atom:link")[0]?.getAttribute("href") || "",
    image: {
      link: getText(doc.getElementsByTagName("image")[0], "link"),
      title: getText(doc.getElementsByTagName("image")[0], "title"),
      url: getText(doc.getElementsByTagName("image")[0], "url"),
    },
    itunesAuthor: getText(doc.documentElement, "itunes:author"),
    itunesCategory: doc.getElementsByTagName("itunes:category")[0]?.getAttribute("text") || "",
    itunesExplicit: getText(doc.documentElement, "itunes:explicit"),
    itunesImage: doc.getElementsByTagName("itunes:image")[0]?.getAttribute("href") || "",
    itunesOwner: {
      email: getText(doc.documentElement, "itunes:email"),
      name: getText(doc.documentElement, "itunes:name"),
    },
    itunesSubtitle: getText(doc.documentElement, "itunes:subtitle"),
    itunesSummary: getText(doc.documentElement, "itunes:summary"),
    itunesType: getText(doc.documentElement, "itunes:type"),
    language: getText(doc.documentElement, "language"),
    link: getText(doc.documentElement, "link"),
    title: getText(doc.documentElement, "title"),
  };

  return { podcast, episodes };
}
