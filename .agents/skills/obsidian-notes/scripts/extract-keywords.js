#!/usr/bin/env node
// Standalone keyword extractor & word counter for Obsidian notes
// Usage: node extract-keywords.js < file.md
//        node extract-keywords.js path/to/file.md
//        cat file.md | node extract-keywords.js

const STOPWORDS_EN = new Set([
  "the","be","to","of","and","a","in","that","have","it","for","not","on","with",
  "he","as","you","do","at","this","but","his","by","from","they","we","say","her",
  "she","or","an","will","my","one","all","would","there","their","what","so","up",
  "out","if","about","who","get","which","go","when","make","can","like","time",
  "just","him","know","take","people","into","year","your","good","some","could",
  "them","see","other","than","then","now","look","only","come","its","over",
  "think","also","back","after","use","two","how","our","work","first","well",
  "way","even","new","want","because","any","these","give","day","most","us",
  "such","here","each","thing","much","own","may","should","need","let","down",
  "many","does","those","very","where","still","being","might","same","ask",
  "too","own","through","just","before","between","under","while","without",
  "along","around","ever","every","few","another","yet","both","shall","since",
  "across","against","within","upon","though","much","well","long","away",
  "often","always","never","done","quite","rather","whatever","already",
  "enough","almost","becoming","regarding","throughout","among","amongst",
  "beside","besides","beyond","despite","during","except","inside","outside",
  "toward","towards","via","whereas","whether","whom","whose","why","indeed",
  "instead","throughout","thus","non","especially",
  "etc","everything","something","nothing","anyone","anything","nobody",
  "somebody","someone","able","cannot","having","used","using","uses",
  "regarding","including","according","accordingly","hence",
  "hereafter","hereby","herein","hereupon","thereafter","thereby","therefore",
  "therein","thereupon","whereafter","whereas","whereby","wherein","whereupon",
  "are","was","were","been","has","had","did","does","doing","am","is",
  "been","being","having","get","getting","got","goes","went","gone",
  "see","saw","seen","know","knew","known","think","thought","take","took","taken",
  "come","came","give","gave","given","find","found","tell","told","show","shown",
  "feel","felt","put","set","let","keep","held","hold","mean","meant","meets",
  "run","ran","move","moved","moves","moving","set","sets","setting","help",
  "helps","helped","helping","does","doesn","didn","don","hasn","haven","isn",
  "aren","wasn","weren","won","wouldn","sh","ll","ve","re","says","said",
  "told","tell","asking","asked","came","come","going","goes","went","gone",
  "getting","got","gotten","made","make","making","need","needs","needed",
  "needing","seems","seemed","seeming","used","using","uses","want","wants",
  "wanted","wants","wanting","let","lets","letting","allow","allows","allowed",
  "allowing","keep","keeps","kept","keeping","start","starts","started",
  "starting","try","tries","tried","trying","stop","stops","stopped","stopping",
]);

const STOPWORDS_FR = new Set([
  "le","la","les","de","du","des","un","une","dans","sur","pour","par","avec",
  "est","sont","ont","ont","ete","être","avoir","faire","plus","moins","tres",
  "aussi","donc","mais","ou","où","et","car","ni","ne","pas","non","si","ce",
  "cet","cette","ces","mon","ton","son","ma","ta","sa","mes","tes","ses","nos",
  "vos","leurs","notre","votre","leur","je","tu","il","elle","nous","vous",
  "ils","elles","me","te","se","lui","leur","eux","ca","cela","ceci","celle",
  "celui","celles","ceux","meme","mêmes","comme","quand","que","qui","quoi",
  "dont","ou","au","aux","en","y","vers","chez","sous","entre","depuis",
  "pendant","durant","avant","apres","après","contre","selon","sans","jusque",
  "jusqu","deja","déjà","encore","toujours","jamais","parfois","souvent",
  "enfin","alors","voici","voila","voilà","peut","peu","bien","fait","chaque",
  "faire","cours","monde","tous","toutes","tout","toute","trop","quel",
  "quelle","quels","quelles","aucun","aucune","certain","certains","certaine",
  "certaines","autre","autres","autrui","plusieurs","tel","telle","tels",
  "telles","pareil","pareille","tellement","comment","pourquoi","combien",
  "longtemps","desormais","désormais","desormais","neanmoins","néanmoins",
  "toutefois","cependant","pourtant","quoique","nonobstant","notamment",
  "soit","voire","environ","quasi","presque","environ","juste","sinon",
  "aupres","aupr","auprès","aupres","parmi","hormis","excepte","excepté",
  "excepte","moyennant","moyennant","moyennant","non","non","oui",
]);

const ALL_STOPWORDS = new Set([...STOPWORDS_EN, ...STOPWORDS_FR]);

function tokenize(text) {
  const words = [...text.matchAll(/[\p{L}][\p{L}'-]{1,40}/gu)].map(m => m[0].toLowerCase());
  return words.flatMap(w => w.includes("'") ? w.split("'").filter(Boolean) : [w]);
}

function cleanToken(t) {
  return t.replace(/^[''\u2019]+|[''\u2019]+$/g, "").toLowerCase();
}

function isValidToken(t) {
  if (ALL_STOPWORDS.has(t)) return false;
  if (t.length < 3) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
}

function findEntities(text) {
  const entities = [];
  const multiWord = [...text.matchAll(/\b((?:[A-Z\u00C0-\u024F][\p{L}]+)\s+(?:[A-Z\u00C0-\u024F][\p{L}]+))\b/g)];
  for (const m of multiWord) {
    const words = m[1].toLowerCase().split(/\s+/);
    if (words.some(w => ALL_STOPWORDS.has(w))) continue;
    entities.push(m[1]);
  }
  return entities;
}

function countWords(text) {
  const noFrontmatter = text.replace(/^---[\s\S]*?---\n*/m, "");
  const cleaned = noFrontmatter
    .replace(/```[\s\S]*?```/g, "")
    .replace(/~~~/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\[([^\]]+?\|)?([^\]]+)\]\]/g, "$2")
    .replace(/\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/^[-*_]{3,}\s*$/gm, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[\d]+\.\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/[*_~]{1,2}/g, "")
    .replace(/[#\[\]()<>]/g, "");
  return cleaned.split(/\s+/).filter(w => /[a-zA-Z0-9\u00C0-\u024F]/.test(w)).length;
}

function extract(text) {
  const noFrontmatter = text.replace(/^---[\s\S]*?---\n*/m, "");
  const noCode = noFrontmatter.replace(/```[\s\S]*?```/g, "").replace(/`[^`]+`/g, "");
  const noMarkdownLinks = noCode.replace(/\[([^\]]*)\]\([^)]+\)/g, "$1");

  const tokens = tokenize(noMarkdownLinks).map(cleanToken).filter(isValidToken);

  const freq = {};
  for (const t of tokens) {
    freq[t] = (freq[t] || 0) + 1;
  }

  const entities = findEntities(noMarkdownLinks);
  const entityFreq = {};
  for (const e of entities) {
    const key = e.toLowerCase();
    entityFreq[key] = (entityFreq[key] || 0) + 1;
  }

  const scored = [];
  const totalTokens = tokens.length;

  for (const [word, count] of Object.entries(freq)) {
    let score = Math.round(count * Math.log(1 + count));

    const entityCount = entityFreq[word] || 0;
    if (entityCount > 0) {
      score += Math.round(entityCount * 3 * Math.log(1 + entityCount));
    }

    const density = Math.min(Math.round((count / totalTokens) * 100 * 8), 20);
    score += density;

    scored.push({ word, score, count, entityCount });
  }

  scored.sort((a, b) => b.score - a.score);

  const tagSet = new Set();
  const tags = [];

  for (const item of scored) {
    if (tags.length >= 10) break;
    let tag = item.word
      .replace(/[''\u2019]/g, "")
      .replace(/\s+/g, "-");
    if (!tagSet.has(tag) && tag.length >= 2) {
      tagSet.add(tag);
      tags.push(tag);
    }
  }

  return { wordCount: countWords(text), tags };
}

const input = process.argv[2]
  ? require("fs").readFileSync(process.argv[2], "utf-8")
  : require("fs").readFileSync(0, "utf-8");

process.stdout.write(JSON.stringify(extract(input)));
