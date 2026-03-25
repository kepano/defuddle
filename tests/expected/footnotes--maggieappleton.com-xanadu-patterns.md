```json
{
  "title": "The Pattern Language of Project Xanadu",
  "author": "",
  "site": "maggieappleton.com",
  "published": "2024-05-24T02:20:06+00:00"
}
```

When it comes to visionary, before-its-time software, it’s hard to find a better archetype than Ted Nelson’s [Project Xanadu](https://en.wikipedia.org/wiki/Project_Xanadu).

It’s infamous in the technology community as a sixty-year project that never quite launched. A cautionary tale of what happens when you overhype, underdeliver, and try to stuff an operating system’s worth of features into a single piece of proprietary software. The kind of tale that makes our ferociously lean startup culture of Move Fast, Break Things, and Demo or Die seem almost sensible.

Xanadu was a hypothetical hypertext system. [^1]

It’s hard to read the word *hypertext* in 2021 <sub>5ya</sub> and not believe its synonymous with the system Tim Berners-Lee built in 1989 <sub>37ya</sub> – the World Wide Web that became so much more than linked text on digital screens. The version of hypertext you are reading this on is the only hypertext most of us have ever known.

And yet the idea of hypertext predates Berners-Lee by two decades. The term was coined in 1963 <sub>63ya</sub> by none other than Ted Nelson as part of a much larger vision; one small brick in the grand Xanadu dream mansion. [^2]

To talk about Xanadu, we need to put a pin in our current understanding of *hypertext*. Our preconceived notions of what a link is, how it works, and what digital text is capable of threatens to overwrite the alternate history we’re about to explore.

Ted hoped Xanadu would be a medium for “ [serious electronic literature](https://xanadu.com.au/ted/XUsurvey/xuDation.html) ” – a paradigm shift that would free us from the material constraints of paper. His vision was the first to meaningfully consider how storing information in digital bits could reconfigure the way we read, write, cite, and share words.

Xanadu’s failure to mature into a widespread, useable commercial product is great fodder a [dramatic cover story](https://www.wired.com/1995/06/xanadu/). One fuelled by the noticeably combative language in Xanadu’s [documentation](https://xanadu.com/):

> “The computer world is a continual war over software politics and paradigms” where “we fight on” for “vindication” and “the last laugh.”

One feels like the dinner guest who has stumbled into a raging marital argument over unwashed tea towels. You don’t dare ask for context.

Yet these historical skirmishes and financial flops are also the least interesting thing about Xanadu. The most interesting part is its **Pattern Language**.

## Architectural Pattern Languages

[Pattern Languages](https://maggieappleton.com-xanadu-patterns/pattern-languages) are sets of flexible, reusable solutions to common design problems.

They come from the land of architects: the software developers of the material world. Namely, the architect [Christopher Alexander](https://en.wikipedia.org/wiki/Christopher_Alexander), whose philosophy of constructing vibrant and humane living space escaped the confines of urban planning and infused the world of software design in the late 1980’s.

In their book [A Pattern Language](https://en.wikipedia.org/wiki/A_Pattern_Language), Alexander defined 253 architectural patterns for designing cities, towns, and homes. These became the example patterns for writing patterns. Each one is composed of a context, problem, example, and solution.

![A Pattern Language](https://maggieappleton.com-xanadu-patterns/_astro/patterns.D8-ibnKY_Z2ngng6.webp)

For example, the design pattern **A Place to Wait** asks that we create comfortable accommodation and ambient activity whenever someone needs to wait; benches, cafes, reading rooms, miniature playgrounds, three-reel slot machines (if we happen to be in the Las Vegas airport). This solves the problem of huddles of people awkwardly hovering in liminal space; near doorways, taking up sidewalks, anxiously waiting for delayed flights or dental operations or immigration investigations without anything to distract them from uncertain fates.

Others like **Light on Two Sides of Every Room** and **Staircase as Stage** are fairly self-explanatory.

There’s no single way to implement these design patterns. They are purposefully abstract enough to adapt to the situation at hand. Rules of thumb rather than sets of formulaic instructions.

## Xanadu as a Design Pattern

Taken as a collection of design patterns, Xanadu’s documentation suggests solutions to some of the hypertextual problems we’re wrestling with today;

- How do we structure information and build relationships between pieces of data that help us see them across contexts, and clarify understanding?
- How do we build systems that allow people to collaborate on shared documents without losing authorship? How do we credit and compensate authors based on their contributions?
- How do we bring ideas and data from a variety of sources into conversation with our own, while leaving a clear trail back to the origin?

Xanadu became a sad parable, when it should have been a piece of speculative design. A set of seeds scattered into the wind for other people to pick up and plant, rather than the patent-happy industrial farming conglomerate it tried to grow into.

Curiously enough, there appear to be rogue seedlings sprouting around the web. A number of Xanadu’s design patterns are showing up in modern manifestations. We’re finding ways to backwards engineer the original spirit of Xanadu into the existing structures of the World Wide Web.

## The Patterns

### 1\. Visible Links

Ted Nelson has many gripes, and **jump links** are one of his biggest. They’re the kind of links we all use around the web today. Clicking a hyperlink is a bit of a gamble. It *jumps* you into somewhere unknown. You find out when you get there.

We’ve found ways to adapt to this; Venkatesh Rao has a compelling exploration of how we’ve developed a [rhetoric of hyperlinking](https://www.ribbonfarm.com/2009/07/01/the-rhetoric-of-the-hyperlink/) to hint at where people are headed. Most browsers will do this more explicitly by showing you a URL preview, but they tuck them into the far corner in tiny text:

![URL hover previews showing in the left hand corner of page](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:good,w_1200/v1623585337/maggieappleton.com/notes/xanadu/hover-preview-url_shrink_kxvwtp.png)

URL hover previews showing in the left hand corner of page

These can only tell you so much when modern URLs are often obscured by link shorteners and overstuffed with tracking queries. These solutions are only a band-aid on the underlying wound. They suggest where you’re headed, rather than showing you.

Nelson’s answer to jump links are **visible links** – links that show you the full context of where you’re headed. These were an essential feature of Xanadu. In the original mockups for “ *Xanadocs* ” linked text would be connected to its source in a rather literal fashion: brightly coloured highlights running between documents.

![One of the original UI mockups for a Xanadoc with visible links between text blocks](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:good,w_1200/v1623916915/maggieappleton.com/notes/xanadu/xanadu_au17yq_shrink_tqkdxs.png)

One of the original UI mockups for a Xanadoc with visible links between text blocks

This proposed solution relies on two other patterns – *parallel documents* and *transpointing windows* (covered below) – but the underlying principle was simply that links made their destinations clear.

In lieu of Xanadoc links, the modern web has landed on some fairly decent solutions to this issue: **hover previews and unfurls**.

**Hover previews** are when you can see a preview of the page you’re headed to when you hover over a link. It’s usually an excerpt that gives you the page title, the first few lines of text, and sometimes an image. Wikipedia was one of the first major sites to [add these](https://blog.wikimedia.org/2018/04/18/how-we-designed-page-previews-for-wikipedia/) in 2018 <sub>8ya</sub> .

![Wikipedia's interface showing one of the hover previews that appear over links](https://res.cloudinary.com/dg3gyk0gu/image/upload/c_scale,f_auto,q_auto:good,w_1000/v1592343673/maggieappleton.com/notes/Screenshot_-_2020-06-16_20.49.44.png)

Wikipedia's interface showing one of the hover previews that appear over links

Hover previews have also become popular in the [Digital Gardening](https://maggieappleton.com-xanadu-patterns/garden-history) community as a way to help visitors quickly navigate through collections of public notes and essays that are deeply interlinked. [Andy Matuschak](https://notes.andymatuschak.org/) and [Gwern Branwen](https://www.gwern.net/index) are two gardeners with good examples of how these work in action.

![Andy Matuschak's notes website featuring hover link previews](https://res.cloudinary.com/dg3gyk0gu/image/upload/c_scale,f_auto,q_auto:good,w_1000/v1592343501/maggieappleton.com/notes/Screenshot_2020-06-16_at_22.38.06.png)

Andy Matuschak's notes website featuring hover link previews

Similar to hover previews, **unfurls** are the preview cards that automagically appear when you paste a link into Twitter, Facebook, Notion, Miro, or any other richly-featured web app. If I paste a link to this great article on [building a more honest internet](https://www.cjr.org/special_report/building-honest-internet-public-interest.php) into a Tweet or Notion document, it automagically displays the feature image, title, and byline without any extra effort from me:

![An open graph image preview appearing in a tweet](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:best,w_800/v1623916885/maggieappleton.com/notes/xanadu/tweet-opengraph_o6eecg.jpg)

An open graph image preview appearing in a tweet

![Open graph previews appear in Notion when you paste a link and select 'Create Bookmark'](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:best,w_1000/v1623917579/maggieappleton.com/notes/xanadu/notion-ogpreview_shrink_ckiuyn.png)

Open graph previews appear in Notion when you paste a link and select 'Create Bookmark'

This system is powered by the [Open Graph Protocol](https://ogp.me/) which Facebook introduced in 2010 <sub>16ya</sub> . This standardised format helps website authors define *metadata* like titles, descriptions, authors, and images for each of their pages. These are automatically retrieved and “unfurled” when the link is pasted elsewhere on the web.

Both hover previews and link unfurls give you a good sense of where you’re headed if you click on a link. They get us to *semi-visible* links.

Previews aren’t quite the same as physical links between parts of a page though. You lose the fine-grained associations between specific paragraphs and lines. If we wanted to dial up the Xanadu-esque visibility, we could work on showing previews of the whole page and directing people to specific pieces of text within it.

### 2\. Parallel Documents

Ted’s proposal for visible links relied on another key Xanadu pattern: **parallel documents arranged side-by-side**. This pattern allow us to see quotations in their original context, and quickly jump to the source material of documents.

It’s also tricky to misquote someone and cherry-pick misleading excerpts when the reader has immediate, effortless access to the original.

![Three parallel documents with visible links between them](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:good,w_900/v1640076312/maggieappleton.com/notes/xanadu/transclusion_6_shrink_sl0vcb_mtepgz.jpg)

Three parallel documents with visible links between them

This sounds great in theory. Being able to lay multiple sheets of paper down side-by-side in meatspace is one of its shining qualities. Humans are very good at visually skimming information spread out in front of us – it allows us to quickly pattern-match by comparing and contrasting.

Ideally our digital mediums would lean into our ability to survey a large visual field. But the limitations of LCD screen sizes lead to some unsatisfying compromises. Instead, we end up squishing columns of documents onto our tiny screens.

The existing prototypes of Xanadu don’t gracefully solve this problem in any way. Some of them – like the 2007 <sub>19ya</sub> *XanaduSpace* demo – suggest launching into the disorienting world of 3D paper where documents tower over you like skyscrapers.

Here’s Ted to give you an interactive tour:

![](https://www.youtube.com/watch?v=cjXW5jKzjCA)

Flying about in multiple dimensions feels slightly distracting when you’re trying to write a detailed product spec or salvage your mediocre thesis.

We have developed some slightly less nauseasting solutions to this problem.

## Draft in Progress

The quality of writing below this point is haphazard, disjointed, and nonsensical. It's probably a good idea to come back later.

Tabs and slide-over windows help us quickly move between documents, although they still fail at letting us see more than two at once.

Many modern note-taking apps have popularised fat “sidebars” that are essentially second windows.

Roam Research, Obsidian, Logseq, and Innos are all designed for parallel documents

Arranging two windows side-by-side doesn’t properly solve this problem. We can’t select things from from one window and drag them into the next. The two windows don’t know about each other and usually can’t interact. They’re connected to different data sources, possibly running in seperate applications. Copying and pasting text, images, or objects between the two is a cumbersome workaround.

The mobile-first responsive web also makes this tricky. There is simply no space on a 320px-wide screen to consider viewing multiple windows at once. Although patterns like horizontal scroll and slide-over windows might help solve this.

### 3\. Transpointing Windows

Parts of documents visibly point to other parts

LiquidText

![The interface of LiquidText with transpointing between sections of text](https://res.cloudinary.com/dxj9qr5gj/image/upload/c_scale,f_auto,q_auto:best,w_1100/v1623925818/maggieappleton.com/notes/xanadu/liquid_rrgru8.png)

The interface of LiquidText with transpointing between sections of text

[Azlen Elza](https://azlen.me/) managed to craft up this crazy demo inside of their Roam Research database.

### 4\. Transclusion

- [Transclusion and Transcopyright Dreams](https://maggieappleton.com-xanadu-patterns/transcopyright-dreams)

### 5\. Bi-Directional Links

- [A Short History of Bi-Directional Links](https://maggieappleton.com-xanadu-patterns/bidirectionals)

### 6\. Version Control

In the age of Git, we tend to take version control for granted.

The first version control system dates back to [1975](https://en.wikipedia.org/wiki/Version_control#History). It’s now difficult to imagine programming without it.

### 7\. Modular Text Blocks

The core building block of the web has always been documents. While the idea of a web *page* has evolved far beyond it’s original idea, we still construct, connect, and navigate websites at the page level.

The early web was built for academic researchers to share their work, in a time before all the plebs invaded with our bleeding-heart livejournal entries, dancing baby GIFs, and TikTok moves. These researchers designed the system to mimic their primary medium of communication; paper-based academic articles and documents.

This paper document design metaphor determined many of the early architectural decisions. URL addresses were set at the *page* level, rather than the paragraph. Inline images were an afterthought, and even a contentious addition to the spec. [^3]

Blocks construct documents

Notion pioneered this in the note-taking space

Explosion of note-taking apps using a block-first approach: Roam, Innos, Clover, Craft, Kosmik

### 8\. Stable, Universal Addresses

The web enforces addresess on the document level rather than the block level

No stability at all, link rot everywhere

URL queries and subpaths

Roam block UIDs

### 9\. Annotation

Hypothesis

Google docs comments

### 10\. Multiple Views and Spatial Arrangements

Graph previews are a weak version of this

Notion linked databases that offer various view types

Most modern dashboards offer multiple ways to view data

ZigZag format

### 11\. Micropayments

Jarons Lanier’s dreams in Who Owns the Future

The inescapable cost of transactions

Web Monetisation API, Coil

Grant for the Web

Graeber’s money-as-debt, soft money, local currencies and DAOs

---

The original Xanadu vision was ambitious. Unreasonably ambitious. The above feature list is a small selection.

Perhaps you sense the problem.  
Solving all the things all at once gets tricky.

Instead, what we’re now seeing is the ad-hoc, decentralised manifestation of Xanadu in bits and pieces.

People are building Xanadu without knowing what Xanadu is.  
Which is the essence of a good pattern language; true patterns evolve naturally within systems, and are found rather than crafted. [^4]

In the grand scheme of things, 60 years isn’t an extraordinary amount of time to spend solving a problem. It’s about 0.09% of history since humans first started creating symbolic cultural artefacts [^5]

Who knows, maybe Xanadu can still happen (if you clap for it) ✨

  
![](https://3.bp.blogspot.com/-s2BU-a7w2bc/VuNwBkwNSSI/AAAAAAAARDg/P_UuFud4PmIfKQoJLq4EHYxVL6YL8TQsw/s1600/XANADU.jpg)

[^1]: The word hypothetical is a bit strong. Many versions were built. There is a working demo showcasing a few of its features [here](http://xanadu.com/xanademos/MoeJusteOrigins.html). But there is no active version on the App Store or Product Hunt I can link you to.

[^2]: While Nelson coined the word, the notion of linked documents goes back to Jorge Luis Borges The Garden of Forking Paths” in 1941 <sub>85ya</sub> and Vannevar Bush’s Memex machine in 1945 <sub>81ya</sub> – both significant, named influences for Nelson.

[^3]: No one seriously considered the possibility of adding videos or animations. The presumption visual images are a impoverished medium for serious intellectual thought is a whole other kettle of fish.

[^4]: Christopher Alexander’s [The Nature of Order](https://en.wikipedia.org/wiki/The_Nature_of_Order) goes deep on this principle

[^5]: Using [La Pasiega Cave](https://en.wikipedia.org/wiki/Cave_of_La_Pasiega) in Spain as a relative marker - 65,000 y.a.