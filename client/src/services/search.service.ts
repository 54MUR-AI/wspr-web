import { Message, MessageSearchFilters } from '../types/message';
import { errorService } from './error.service';

class SearchService {
  private static instance: SearchService;
  private searchIndex: Map<string, Message> = new Map();
  private readonly SEARCH_BATCH_SIZE = 50;

  private constructor() {
    this.initializeSearchIndex();
  }

  static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  async searchMessages(query: string, filters?: MessageSearchFilters): Promise<Message[]> {
    try {
      const searchResults = await this.performSearch(query, filters);
      return this.rankResults(searchResults, query);
    } catch (error) {
      errorService.handleError(error, 'SEARCH_MESSAGES_FAILED', 'medium');
      throw error;
    }
  }

  async indexMessage(message: Message): Promise<void> {
    try {
      this.searchIndex.set(message.id, message);
      // Implement server sync for search index
    } catch (error) {
      errorService.handleError(error, 'INDEX_MESSAGE_FAILED', 'low');
    }
  }

  private async performSearch(
    query: string,
    filters?: MessageSearchFilters
  ): Promise<Message[]> {
    const results: Message[] = [];
    const searchTerms = query.toLowerCase().split(' ');

    for (const message of this.searchIndex.values()) {
      if (this.messageMatchesSearch(message, searchTerms, filters)) {
        results.push(message);
      }

      if (results.length >= this.SEARCH_BATCH_SIZE) {
        break;
      }
    }

    return results;
  }

  private messageMatchesSearch(
    message: Message,
    searchTerms: string[],
    filters?: MessageSearchFilters
  ): boolean {
    if (!this.messageMatchesFilters(message, filters)) {
      return false;
    }

    const content = message.content.toLowerCase();
    const matchesTerms = searchTerms.every(term => {
      if (filters?.excludeKeywords?.includes(term)) {
        return !content.includes(term);
      }
      return content.includes(term);
    });

    return matchesTerms;
  }

  private messageMatchesFilters(
    message: Message,
    filters?: MessageSearchFilters
  ): boolean {
    if (!filters) return true;

    const {
      startDate,
      endDate,
      sender,
      hasAttachments,
      hasReactions,
      isThread,
      status,
    } = filters;

    if (startDate && message.timestamp < startDate.getTime()) return false;
    if (endDate && message.timestamp > endDate.getTime()) return false;
    if (sender && message.userId !== sender) return false;
    if (hasAttachments && !message.attachments?.length) return false;
    if (hasReactions && !message.reactions?.length) return false;
    if (isThread && !message.threadId) return false;
    if (status && message.status !== status) return false;

    return true;
  }

  private rankResults(results: Message[], query: string): Message[] {
    const queryTerms = query.toLowerCase().split(' ');
    
    return results.sort((a, b) => {
      const scoreA = this.calculateRelevanceScore(a, queryTerms);
      const scoreB = this.calculateRelevanceScore(b, queryTerms);
      return scoreB - scoreA;
    });
  }

  private calculateRelevanceScore(message: Message, queryTerms: string[]): number {
    let score = 0;
    const content = message.content.toLowerCase();

    // Term frequency
    queryTerms.forEach(term => {
      const count = (content.match(new RegExp(term, 'g')) || []).length;
      score += count;
    });

    // Boost factors
    if (message.reactions?.length) score += 0.5;
    if (message.replies?.length) score += 0.3;
    if (message.attachments?.length) score += 0.2;
    
    // Recency boost (within last 24 hours)
    const isRecent = Date.now() - message.timestamp < 24 * 60 * 60 * 1000;
    if (isRecent) score += 0.5;

    return score;
  }

  private async initializeSearchIndex(): Promise<void> {
    try {
      // Implement loading initial messages from server
      window.addEventListener('wspr:message:new', this.handleNewMessage.bind(this));
    } catch (error) {
      errorService.handleError(error, 'INITIALIZE_SEARCH_INDEX_FAILED', 'high');
    }
  }

  private handleNewMessage(event: CustomEvent): void {
    const message: Message = event.detail;
    this.indexMessage(message);
  }
}

export const searchService = SearchService.getInstance();
