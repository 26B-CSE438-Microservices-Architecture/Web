import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SearchQuery, SearchResult, DiscoveryResult, Campaign } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiBase = environment.apiBaseUrl;

  search(query: SearchQuery): Observable<SearchResult> {
    let params = new HttpParams();
    if (query.q) params = params.set('q', query.q);
    if (query.category) params = params.set('category', query.category);
    if (query.page != null) params = params.set('page', query.page);
    if (query.size != null) params = params.set('size', query.size);
    return this.http.get<SearchResult>(`${this.apiBase}/search`, { params });
  }

  getDiscovery(): Observable<DiscoveryResult> {
    return this.http.get<DiscoveryResult>(`${this.apiBase}/search/discovery`);
  }

  getHomeDiscover(): Observable<DiscoveryResult> {
    return this.http.get<DiscoveryResult>(`${this.apiBase}/home/discover`);
  }

  getCampaigns(): Observable<Campaign[]> {
    return this.http.get<Campaign[]>(`${this.apiBase}/campaigns`);
  }
}
