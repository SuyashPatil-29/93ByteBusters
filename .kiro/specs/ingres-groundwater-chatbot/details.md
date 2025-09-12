// Types for INGRES location data
export interface LocationData {
  name: string;
  type: 'STATE' | 'DISTRICT' | 'BLOCK';
  uuid: string;
  parentUuid?: string; // For districts (parent = state), for blocks (parent = district)
  parentName?: string;
}

export interface StateData extends LocationData {
  type: 'STATE';
  districts: DistrictData[];
}

export interface DistrictData extends LocationData {
  type: 'DISTRICT';
  parentUuid: string; // State UUID
  parentName: string; // State name
  blocks: BlockData[];
}

export interface BlockData extends LocationData {
  type: 'BLOCK';
  parentUuid: string; // District UUID
  parentName: string; // District name
}

export interface LocationMapping {
  states: Map<string, StateData>;
  districts: Map<string, DistrictData>;
  blocks: Map<string, BlockData>;
}

// Service to find UUIDs for locations
export class INGRESLocationService {
  private locationMapping: LocationMapping;
  private firecrawl: any; // FireCrawl instance

  constructor(firecrawl: any) {
    this.firecrawl = firecrawl;
    this.locationMapping = {
      states: new Map(),
      districts: new Map(),
      blocks: new Map()
    };
  }

  // Method 1: Try to find UUIDs from a known working URL pattern
  async findLocationUUIDs(locationName: string, locationType: 'STATE' | 'DISTRICT' | 'BLOCK'): Promise<{
    locuuid: string;
    stateuuid: string;
  } | null> {
    try {
      // First check our cached mapping
      const cached = this.getCachedUUIDs(locationName, locationType);
      if (cached) return cached;

      // Try to scrape from INGRES website
      const scrapedUUIDs = await this.scrapeLocationUUIDs(locationName, locationType);
      if (scrapedUUIDs) {
        this.cacheLocationData(locationName, locationType, scrapedUUIDs);
        return scrapedUUIDs;
      }

      return null;
    } catch (error) {
      console.error('Error finding location UUIDs:', error);
      return null;
    }
  }

  // Method 2: Build comprehensive mapping by crawling INGRES
  async buildLocationMapping(): Promise<void> {
    try {
      console.log('Building INGRES location mapping...');
      
      // Step 1: Scrape the main INGRES page to find state navigation
      const mainPageData = await this.firecrawl.scrapeUrl({
        url: 'https://ingres.iith.ac.in/gecdataonline/gis/INDIA',
        formats: ['html', 'links'],
        includeTags: ['a', 'script', 'div[data-*]', 'option'],
      });

      // Step 2: Extract state information from the scraped data
      const states = this.extractStatesFromHTML(mainPageData.html);
      
      // Step 3: For each state, get districts
      for (const state of states) {
        console.log(`Processing state: ${state.name}`);
        await this.processStateDistricts(state);
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log('Location mapping built successfully');
    } catch (error) {
      console.error('Error building location mapping:', error);
    }
  }

  private async scrapeLocationUUIDs(locationName: string, locationType: string): Promise<{
    locuuid: string;
    stateuuid: string;
  } | null> {
    try {
      // Try different URL patterns based on location type
      const searchUrls = this.generateSearchUrls(locationName, locationType);
      
      for (const url of searchUrls) {
        try {
          const result = await this.firecrawl.scrapeUrl({
            url,
            formats: ['html'],
            waitFor: 2000,
          });

          const uuids = this.extractUUIDsFromHTML(result.html);
          if (uuids.locuuid && uuids.stateuuid) {
            return uuids;
          }
        } catch (scrapeError) {
          console.warn(`Failed to scrape ${url}:`, scrapeError);
          continue;
        }
      }

      return null;
    } catch (error) {
      console.error('Error scraping location UUIDs:', error);
      return null;
    }
  }

  private generateSearchUrls(locationName: string, locationType: string): string[] {
    const encodedName = encodeURIComponent(locationName);
    const baseUrl = 'https://ingres.iith.ac.in/gecdataonline/gis/INDIA';
    
    // Generate multiple URL patterns to try
    const urls = [
      `${baseUrl};locname=${encodedName};loctype=${locationType}`,
      `${baseUrl}?search=${encodedName}`,
      `${baseUrl}/search?q=${encodedName}&type=${locationType.toLowerCase()}`,
    ];

    return urls;
  }

  private extractUUIDsFromHTML(html: string): { locuuid?: string; stateuuid?: string } {
    const uuids: { locuuid?: string; stateuuid?: string } = {};

    // Look for UUID patterns in the HTML
    const locuuidMatch = html.match(/locuuid[=:]([a-f0-9-]{36})/i);
    const stateuuidMatch = html.match(/stateuuid[=:]([a-f0-9-]{36})/i);

    if (locuuidMatch) uuids.locuuid = locuuidMatch[1];
    if (stateuuidMatch) uuids.stateuuid = stateuuidMatch[1];

    return uuids;
  }

  private extractStatesFromHTML(html: string): StateData[] {
    const states: StateData[] = [];
    
    // Look for state data in various formats:
    // 1. JavaScript objects
    // 2. Select options
    // 3. Data attributes
    // 4. Links with state information

    // Pattern 1: Look for JavaScript state data
    const jsStatePattern = /states?\s*[:=]\s*\[([^\]]+)\]/gi;
    const jsMatch = html.match(jsStatePattern);
    
    if (jsMatch) {
      // Parse JavaScript object for state data
      try {
        const stateDataStr = jsMatch[0];
        // Extract state objects from the JS data
        const stateObjects = this.parseJSStateData(stateDataStr);
        states.push(...stateObjects);
      } catch (error) {
        console.warn('Failed to parse JS state data:', error);
      }
    }

    // Pattern 2: Look for HTML select options
    const optionPattern = /<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi;
    let optionMatch;
    while ((optionMatch = optionPattern.exec(html)) !== null) {
      const [, value, text] = optionMatch;
      if (this.isUUID(value) && text.length > 2) {
        states.push({
          name: text.trim(),
          type: 'STATE',
          uuid: value,
          districts: []
        });
      }
    }

    // Pattern 3: Look for data attributes
    const dataStatePattern = /data-state-uuid="([^"]+)"[^>]*>([^<]+)</gi;
    let dataMatch;
    while ((dataMatch = dataStatePattern.exec(html)) !== null) {
      const [, uuid, name] = dataMatch;
      states.push({
        name: name.trim(),
        type: 'STATE',
        uuid,
        districts: []
      });
    }

    return this.deduplicateStates(states);
  }

  private parseJSStateData(jsData: string): StateData[] {
    // This method would parse JavaScript objects containing state data
    // Implementation depends on the actual format used by INGRES
    const states: StateData[] = [];
    
    try {
      // Remove JavaScript syntax and extract JSON-like data
      const cleanData = jsData
        .replace(/states?\s*[:=]\s*/, '')
        .replace(/[{}]/g, '')
        .replace(/'/g, '"');
      
      // Parse the cleaned data for state information
      // This is a simplified example - actual implementation would be more robust
      const stateMatches = cleanData.match(/name:\s*"([^"]+)".*?uuid:\s*"([^"]+)"/g);
      
      if (stateMatches) {
        for (const match of stateMatches) {
          const nameMatch = match.match(/name:\s*"([^"]+)"/);
          const uuidMatch = match.match(/uuid:\s*"([^"]+)"/);
          
          if (nameMatch && uuidMatch) {
            states.push({
              name: nameMatch[1],
              type: 'STATE',
              uuid: uuidMatch[1],
              districts: []
            });
          }
        }
      }
    } catch (error) {
      console.warn('Error parsing JS state data:', error);
    }
    
    return states;
  }

  private async processStateDistricts(state: StateData): Promise<void> {
    try {
      // Try to get district data for this state
      const stateUrl = `https://ingres.iith.ac.in/gecdataonline/gis/INDIA;stateuuid=${state.uuid}`;
      
      const statePageData = await this.firecrawl.scrapeUrl({
        url: stateUrl,
        formats: ['html'],
        waitFor: 2000,
      });

      const districts = this.extractDistrictsFromHTML(statePageData.html, state);
      state.districts = districts;
      
      // Cache the districts
      districts.forEach(district => {
        this.locationMapping.districts.set(district.name, district);
      });

    } catch (error) {
      console.error(`Error processing districts for state ${state.name}:`, error);
    }
  }

  private extractDistrictsFromHTML(html: string, parentState: StateData): DistrictData[] {
    const districts: DistrictData[] = [];
    
    // Similar extraction logic as states, but for districts
    const optionPattern = /<option[^>]*value="([^"]*)"[^>]*>([^<]+)<\/option>/gi;
    let optionMatch;
    
    while ((optionMatch = optionPattern.exec(html)) !== null) {
      const [, value, text] = optionMatch;
      if (this.isUUID(value) && text.length > 2) {
        districts.push({
          name: text.trim(),
          type: 'DISTRICT',
          uuid: value,
          parentUuid: parentState.uuid,
          parentName: parentState.name,
          blocks: []
        });
      }
    }

    return districts;
  }

  private isUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private deduplicateStates(states: StateData[]): StateData[] {
    const seen = new Set<string>();
    return states.filter(state => {
      const key = `${state.name}-${state.uuid}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getCachedUUIDs(locationName: string, locationType: string): {
    locuuid: string;
    stateuuid: string;
  } | null {
    switch (locationType) {
      case 'STATE':
        const state = this.locationMapping.states.get(locationName);
        return state ? { locuuid: state.uuid, stateuuid: state.uuid } : null;
        
      case 'DISTRICT':
        const district = this.locationMapping.districts.get(locationName);
        return district ? { locuuid: district.uuid, stateuuid: district.parentUuid } : null;
        
      case 'BLOCK':
        const block = this.locationMapping.blocks.get(locationName);
        if (block) {
          const parentDistrict = this.locationMapping.districts.get(block.parentName);
          return parentDistrict ? 
            { locuuid: block.uuid, stateuuid: parentDistrict.parentUuid } : null;
        }
        return null;
        
      default:
        return null;
    }
  }

  private cacheLocationData(locationName: string, locationType: string, uuids: {
    locuuid: string;
    stateuuid: string;
  }): void {
    // Cache the discovered UUID data for future use
    switch (locationType) {
      case 'STATE':
        this.locationMapping.states.set(locationName, {
          name: locationName,
          type: 'STATE',
          uuid: uuids.locuuid,
          districts: []
        });
        break;
        
      case 'DISTRICT':
        // For districts, we need to find the parent state
        // This might require additional logic to determine the state
        this.locationMapping.districts.set(locationName, {
          name: locationName,
          type: 'DISTRICT',
          uuid: uuids.locuuid,
          parentUuid: uuids.stateuuid,
          parentName: '', // Would need to resolve this
          blocks: []
        });
        break;
    }
  }

  // Utility method to search for location by partial name
  async searchLocation(partialName: string): Promise<LocationData[]> {
    const results: LocationData[] = [];
    const searchTerm = partialName.toLowerCase();

    // Search in cached states
    for (const state of this.locationMapping.states.values()) {
      if (state.name.toLowerCase().includes(searchTerm)) {
        results.push(state);
      }
    }

    // Search in cached districts
    for (const district of this.locationMapping.districts.values()) {
      if (district.name.toLowerCase().includes(searchTerm)) {
        results.push(district);
      }
    }

    // Search in cached blocks
    for (const block of this.locationMapping.blocks.values()) {
      if (block.name.toLowerCase().includes(searchTerm)) {
        results.push(block);
      }
    }

    return results;
  }
}

// Usage example:
export async function findBengaluruUUIDs(firecrawl: any): Promise<{
  locuuid: string;
  stateuuid: string;
} | null> {
  const locationService = new INGRESLocationService(firecrawl);
  
  // Try to find UUIDs for Bengaluru Urban district
  const result = await locationService.findLocationUUIDs('Bengaluru (Urban)', 'DISTRICT');
  
  if (!result) {
    console.log('UUIDs not found, building location mapping...');
    await locationService.buildLocationMapping();
    
    // Try again after building the mapping
    return await locationService.findLocationUUIDs('Bengaluru (Urban)', 'DISTRICT');
  }
  
  return result;
}