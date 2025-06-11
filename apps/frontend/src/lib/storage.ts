import type { Brand, Generation, StorageData } from '@/types/brand';

const STORAGE_KEY = 'astra-brands-data';
const STORAGE_VERSION = '1.0.0';

class StorageService {
  private data: StorageData;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): StorageData {
    if (typeof window === 'undefined') {
      return { brands: [], version: STORAGE_VERSION };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as StorageData;
        // Handle version migration if needed in the future
        return parsed;
      }
    } catch (error) {
      console.error('Error loading storage data:', error);
    }

    return { brands: [], version: STORAGE_VERSION };
  }

  private saveData(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (error) {
      console.error('Error saving storage data:', error);
    }
  }

  // Brand operations
  getAllBrands(): Brand[] {
    return [...this.data.brands];
  }

  getBrandById(id: string): Brand | null {
    return this.data.brands.find((brand) => brand.id === id) || null;
  }

  getBrandByDomain(domain: string): Brand | null {
    return this.data.brands.find((brand) => brand.domain === domain) || null;
  }

  createBrand(name: string, domain: string): Brand {
    const newBrand: Brand = {
      id: `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      domain,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generations: [],
    };

    this.data.brands.push(newBrand);
    this.saveData();
    return newBrand;
  }

  updateBrand(
    id: string,
    updates: Partial<Omit<Brand, 'id' | 'createdAt'>>,
  ): Brand | null {
    const brandIndex = this.data.brands.findIndex((brand) => brand.id === id);
    if (brandIndex === -1) return null;

    this.data.brands[brandIndex] = {
      ...this.data.brands[brandIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveData();
    return this.data.brands[brandIndex];
  }

  deleteBrand(id: string): boolean {
    const initialLength = this.data.brands.length;
    this.data.brands = this.data.brands.filter((brand) => brand.id !== id);

    if (this.data.brands.length < initialLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Generation operations
  addGeneration(
    brandId: string,
    generation: Omit<Generation, 'id' | 'brandId' | 'createdAt'>,
  ): Generation | null {
    const brand = this.getBrandById(brandId);
    if (!brand) return null;

    const newGeneration: Generation = {
      id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      brandId,
      ...generation,
      createdAt: new Date().toISOString(),
    };

    brand.generations.push(newGeneration);
    this.updateBrand(brandId, { generations: brand.generations });

    return newGeneration;
  }

  getGenerationsByBrand(brandId: string): Generation[] {
    const brand = this.getBrandById(brandId);
    return brand ? [...brand.generations] : [];
  }

  // Utility method to get or create brand by domain
  getOrCreateBrand(domain: string): Brand {
    let brand = this.getBrandByDomain(domain);
    if (!brand) {
      // Extract brand name from domain (e.g., "example.com" -> "Example")
      const brandName = domain
        .split('.')[0]
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      brand = this.createBrand(brandName, domain);
    }
    return brand;
  }

  // Clear all data (useful for testing)
  clearAll(): void {
    this.data = { brands: [], version: STORAGE_VERSION };
    this.saveData();
  }
}

// Export singleton instance
export const storage = new StorageService();
