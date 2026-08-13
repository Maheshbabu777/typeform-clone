class TrieNode {
  children: Record<string, TrieNode> = {};
  formIds: Set<number> = new Set();
}

export class FormSearchTrie {
  root: TrieNode;

  constructor() {
    this.root = new TrieNode();
  }

  insert(title: string, formId: number) {
    // Index every word in the title so we can prefix-match any word
    const words = title.toLowerCase().split(/\s+/);
    for (const word of words) {
      if (!word) continue;
      let node = this.root;
      for (const char of word) {
        if (!node.children[char]) {
          node.children[char] = new TrieNode();
        }
        node = node.children[char];
        node.formIds.add(formId);
      }
    }
  }

  search(query: string): Set<number> {
    const term = query.toLowerCase().trim();
    if (!term) return new Set();

    const words = term.split(/\s+/);
    const resultSets: Set<number>[] = [];

    for (const word of words) {
      if (!word) continue;
      let node = this.root;
      let found = true;
      
      for (const char of word) {
        if (!node.children[char]) {
          found = false;
          break;
        }
        node = node.children[char];
      }
      
      if (found) {
        resultSets.push(node.formIds);
      } else {
        return new Set(); // Word prefix not found at all
      }
    }

    if (resultSets.length === 0) return new Set();

    // Intersect the sets to ensure all words in the query match
    let intersection = new Set(resultSets[0]);
    for (let i = 1; i < resultSets.length; i++) {
      const current = resultSets[i];
      intersection = new Set([...intersection].filter(x => current.has(x)));
    }
    
    return intersection;
  }
}
