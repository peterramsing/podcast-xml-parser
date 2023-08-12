import { useEffect, useState } from "react";
import podcastXmlParser from "podcast-xml-parser";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/prism";

const PODCAST_FEEDS = [
  "https://feeds.megaphone.fm/climbinggold",
  "https://feeds.simplecast.com/dHoohVNH",
  "https://rss.art19.com/smartless",
  "https://feeds.simplecast.com/qm_9xx0g",
  "https://feeds.megaphone.fm/STU4418364045",
  "https://feeds.simplecast.com/4T39_jAj",
  "https://feeds.npr.org/500005/podcast.xml",
];

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState("");
  const [podcast, setPodcast] = useState({});
  const [episodes, setEpisodes] = useState([]);
  const [itunes, setItunes] = useState(null);
  const [readmeContent, setReadmeContent] = useState("");

  async function fetchPodcast(source) {
    try {
      setLoading(true);
      setError(null);
      const { podcast, episodes, itunes } = await podcastXmlParser(source, { itunes: false });
      setPodcast(podcast);
      setEpisodes(episodes);
      setItunes(itunes || null);
    } catch (error) {
      console.log(error);
      if (source === "https://feeds.npr.org/500005/podcast.xml") {
        setError({
          message: `You were unlucky. This feed (${source}) has CORS enabled.\nIt is included in the demo to demonstrate that browser based parsing is not reliable.\nUse this library in Node or React Native to parse this feed reliably.\n\nError: ${error}`,
        });
      } else {
        setError(error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchReadme() {
    try {
      const readmeUrl = "https://raw.githubusercontent.com/krestaino/podcast-xml-parser/main/README.md";
      const response = await fetch(readmeUrl);
      const readmeText = await response.text();
      setReadmeContent(readmeText);
    } catch (error) {
      console.error("Error fetching README.md:", error);
    }
  }

  function getRandomFeed() {
    const randomIndex = Math.floor(Math.random() * PODCAST_FEEDS.length);
    const source = PODCAST_FEEDS[randomIndex];
    setSource(source);
    return source;
  }

  function preprocessReadmeContent(content) {
    const hideSectionStartTag = "<!-- HIDE_SECTION_START -->";
    const hideSectionEndTag = "<!-- HIDE_SECTION_END -->";

    const hiddenSectionStart = content.indexOf(hideSectionStartTag);
    const hiddenSectionEnd = content.indexOf(hideSectionEndTag);

    if (hiddenSectionStart !== -1 && hiddenSectionEnd !== -1) {
      const beforeHidden = content.substring(0, hiddenSectionStart);
      const afterHidden = content.substring(hiddenSectionEnd + hideSectionEndTag.length);
      return beforeHidden + afterHidden;
    }

    return content;
  }

  useEffect(() => {
    fetchReadme();
  }, []);

  return (
    <div>
      <section className="bg-neutral-800 py-4">
        <div className="max-w-5xl mx-auto">
          <form
            className="flex flex-col"
            onSubmit={(event) => {
              event.preventDefault();
              fetchPodcast(source);
            }}
          >
            <h2 className="text-2xl font-bold">Try the demo</h2>
            <input
              className="bg-neutral-700 p-2 rounded flex-grow mt-4"
              id="urlInput"
              type="text"
              onChange={(event) => setSource(event.target.value)}
              placeholder="Enter Podcast XML URL"
              value={source}
            />
            <div className="mt-4">
              <button className="bg-neutral-200 text-neutral-900 p-2 rounded" type="submit">
                Parse URL
              </button>
              <button
                onClick={(event) => {
                  event.preventDefault();
                  fetchPodcast(new URL("https://feeds.megaphone.fm/climbinggold"));
                }}
                className="bg-neutral-700 p-2 rounded ml-4"
              >
                Small Feed
              </button>
              <button
                onClick={(event) => {
                  event.preventDefault();
                  fetchPodcast(new URL("https://feeds.simplecast.com/54nAGcIl"));
                }}
                className="bg-neutral-700 p-2 rounded ml-4"
              >
                Massive Feed
              </button>
              <button
                onClick={(event) => {
                  event.preventDefault();
                  fetchPodcast(new URL(getRandomFeed()));
                }}
                className="bg-neutral-700 p-2 rounded ml-4"
              >
                I'm Feeling Lucky
              </button>
            </div>
          </form>
        </div>
      </section>
      <section>
        {loading ? (
          <pre className="bg-blue-400">
            <div className="max-w-5xl mx-auto text-neutral-900 py-2">Loading...</div>
          </pre>
        ) : error ? (
          <pre className="bg-red-400">
            <div className="max-w-5xl mx-auto text-neutral-900 py-2">{error.message}</div>
          </pre>
        ) : podcast.feedUrl ? (
          <section className="font-mono mt-8 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold">Podcast ({podcast.title})</h2>
            <table className="mt-4 w-full bg-neutral-800 block overflow-scroll h-[35vh]">
              <thead className="bg-neutral-700">
                <tr>
                  <th className="border border-neutral-600 p-2 font-bold">key</th>
                  <th className="border border-neutral-600 p-2 font-bold">value</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(podcast).map((key) => (
                  <tr key={key}>
                    <td className="border border-neutral-600 p-2">{key}</td>
                    <td className="border border-neutral-600 p-2">{JSON.stringify(podcast[key])}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="my-8">
              <h2 className="text-2xl font-bold">Episodes ({episodes.length})</h2>
              <div className="overflow-scroll h-[35vh]">
                {episodes.map((episode, episodeIdx) => (
                  <table className="mt-4 w-full bg-neutral-800 block" key={episodeIdx}>
                    <thead className="bg-neutral-700">
                      <tr>
                        <th className="border border-neutral-600 p-2 font-bold">key</th>
                        <th className="border border-neutral-600 p-2 font-bold">value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(episode).map((key) => (
                        <tr key={key}>
                          <td className="border border-neutral-600 p-2">{key}</td>
                          <td className="border border-neutral-600 p-2">{JSON.stringify(episode[key])}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ))}
              </div>
            </div>

            {itunes !== null && itunes !== undefined && (
              <div className="my-8">
                <h2 className="text-2xl font-bold">iTunes</h2>
                <table className="mt-4 w-full bg-neutral-800 block overflow-scroll h-[35vh]">
                  <thead className="bg-neutral-700">
                    <tr>
                      <th className="border border-neutral-600 p-2 font-bold">key</th>
                      <th className="border border-neutral-600 p-2 font-bold">value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(itunes).map((key) => (
                      <tr key={key}>
                        <td className="border border-neutral-600 p-2">{key}</td>
                        <td className="border border-neutral-600 p-2">{JSON.stringify(itunes[key])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : null}
      </section>

      <section className={podcast.feedUrl ? "bg-neutral-800" : ""}>
        <div className="prose prose-neutral dark:prose-invert max-w-5xl mx-auto py-8">
          <div className="flex mb-4">
            <a href="https://github.com/krestaino/podcast-xml-parser">
              <img
                src="https://img.shields.io/github/package-json/v/krestaino/podcast-xml-parser/main?label=GitHub"
                className="m-0"
              />
            </a>
            <a href="https://www.npmjs.com/package/podcast-xml-parser">
              <img src="https://img.shields.io/npm/v/podcast-xml-parser?color=red" className="m-0 ml-2" />
            </a>
            <img src="https://img.shields.io/github/license/krestaino/podcast-xml-parser.svg" className="m-0 ml-2" />
          </div>
          <ReactMarkdown
            children={preprocessReadmeContent(readmeContent)}
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    {...props}
                    children={String(children).replace(/\n$/, "")}
                    style={a11yDark}
                    language={match[1]}
                    PreTag="div"
                  />
                ) : (
                  <code {...props} className={className}>
                    {children}
                  </code>
                );
              },
            }}
          />
        </div>
      </section>
    </div>
  );
}

export default App;
