import fetchMock from "jest-fetch-mock";

import { ERROR_MESSAGES } from "../../constants";
import { fetchData } from "../../utils";

fetchMock.enableMocks();

describe("fetchData", () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it("should fetch and return the podcast feed content", async () => {
    const mockFeedContent = "<xml>Podcast Feed</xml>";
    fetchMock.mockResponseOnce(mockFeedContent);

    const url = new URL("https://example.com/podcast.xml");
    const result = await fetchData(url);

    expect(result).toEqual(mockFeedContent);
    expect(fetchMock).toHaveBeenCalledWith(url.toString(), { headers: new Headers({}) });
  });

  it("should apply custom headers if provided", async () => {
    const mockFeedContent = "<xml>Podcast Feed</xml>";
    fetchMock.mockResponseOnce(mockFeedContent);

    const url = new URL("https://example.com/podcast.xml");
    const customHeaders = { "X-Custom-Header": "Value" };
    const result = await fetchData(url, { requestHeaders: customHeaders });

    expect(result).toEqual(mockFeedContent);
    expect(fetchMock).toHaveBeenCalledWith(url.toString(), {
      headers: new Headers(customHeaders),
    });
  });

  it("should apply Range header if requestSize is provided", async () => {
    const mockFeedContent = "<xml>Podcast Feed</xml>";
    fetchMock.mockResponseOnce(mockFeedContent);

    const url = new URL("https://example.com/podcast.xml");
    const requestSize = 500;
    const result = await fetchData(url, { requestSize });

    expect(result).toEqual(mockFeedContent);
    expect(fetchMock).toHaveBeenCalledWith(url.toString(), {
      headers: new Headers({ Range: `bytes=0-${requestSize}` }),
    });
  });

  it("should throw an error if the fetch request fails", async () => {
    fetchMock.mockReject(new Error("Network error"));

    const url = new URL("https://example.com/podcast.xml");
    await expect(fetchData(url)).rejects.toThrow("Network error");
  });

  it("should throw an error if the response is not ok", async () => {
    const mockStatusText = "Not Found";
    fetchMock.mockResponseOnce("", {
      status: 404,
      statusText: mockStatusText,
    });

    const url = new URL("https://example.com/podcast.xml");
    await expect(fetchData(url)).rejects.toThrow(ERROR_MESSAGES.FETCH_FAILED);
  });
});
